from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import csv
import io
import json
from datetime import datetime

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/export",
    tags=["export"]
)

@router.get("/transactions")
def export_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = Query("csv", enum=["csv", "json"]),
    db: Session = Depends(get_db)
):
    # Base query
    query = db.query(models.Transaction)
    
    # Filter by date if provided
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
        
    transactions = query.order_by(models.Transaction.date.desc()).all()
    
    if format == "json":
        data = [
            {
                "date": t.date.isoformat() if t.date else None,
                "description": t.description,
                "amount": float(t.amount),
                "category": t.bucket.name if t.bucket else "Uncategorized",
                "account": t.account.name if t.account else "Unknown",
                "type": "income" if t.amount > 0 else "expense",
                "notes": t.notes
            }
            for t in transactions
        ]
        
        # Create a generator-like stream for JSON
        json_str = json.dumps(data, indent=2)
        return StreamingResponse(
            io.StringIO(json_str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=transactions_export_{datetime.now().strftime('%Y%m%d')}.json"}
        )
        
    else: # CSV
        stream = io.StringIO()
        writer = csv.writer(stream)
        
        # Write header
        writer.writerow(["Date", "Description", "Amount", "Type", "Category", "Account", "Notes"])
        
        # Write data
        for t in transactions:
            writer.writerow([
                t.date,
                t.description,
                t.amount,
                "Income" if t.amount > 0 else "Expense",
                t.bucket.name if t.bucket else "Uncategorized",
                t.account.name if t.account else "Unknown",
                t.notes or ""
            ])
            
        stream.seek(0)
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=transactions_export_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

@router.get("/net-worth")
def export_net_worth(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Fetch history
    query = db.query(models.NetWorthSnapshot)
    
    if start_date:
        query = query.filter(models.NetWorthSnapshot.date >= start_date)
    if end_date:
        query = query.filter(models.NetWorthSnapshot.date <= end_date)
        
    snapshots = query.order_by(models.NetWorthSnapshot.date.desc()).all()
    
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    # Header
    writer.writerow(["Date", "Total Net Worth", "Total Assets", "Total Liabilities"])
    
    # Data
    for s in snapshots:
        writer.writerow([
            s.date,
            s.net_worth,
            s.total_assets,
            s.total_liabilities
        ])
        
    stream.seek(0)
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=net_worth_history_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/report/pdf")
def export_report_pdf(
    start_date: str = Query(..., description="ISO Date string"),
    end_date: str = Query(..., description="ISO Date string"),
    spender: str = Query(default="Combined"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generate a professional PDF financial report.
    Includes: Summary statistics, category breakdown chart, and transaction list.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.charts.piecharts import Pie
    import io
    
    try:
        s_date = datetime.fromisoformat(start_date)
        e_date = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Fetch data
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= s_date,
        models.Transaction.date <= e_date
    )
    
    if spender != "Combined":
        transactions = transactions.filter(models.Transaction.spender == spender)
    
    transactions = transactions.order_by(models.Transaction.date.desc()).all()
    
    # Calculate summary stats
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)
    net_savings = total_income - total_expenses
    
    # Category breakdown
    category_totals = {}
    for t in transactions:
        if t.amount < 0:  # Only expenses
            cat_name = t.bucket.name if t.bucket else "Uncategorized"
            category_totals[cat_name] = category_totals.get(cat_name, 0) + abs(t.amount)
    
    # Sort by amount descending
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=20,
        textColor=colors.HexColor('#1e293b')
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#64748b')
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#334155')
    )
    
    elements = []
    
    # Title
    elements.append(Paragraph("DollarData Financial Report", title_style))
    elements.append(Paragraph(
        f"Period: {s_date.strftime('%B %d, %Y')} to {e_date.strftime('%B %d, %Y')}",
        subtitle_style
    ))
    if spender != "Combined":
        elements.append(Paragraph(f"Spender: {spender}", subtitle_style))
    elements.append(Spacer(1, 0.5*inch))
    
    # Summary Section
    elements.append(Paragraph("Summary", section_style))
    summary_data = [
        ["Total Income", f"${total_income:,.2f}"],
        ["Total Expenses", f"${total_expenses:,.2f}"],
        ["Net Savings", f"${net_savings:,.2f}"],
        ["Savings Rate", f"{(net_savings/total_income*100):.1f}%" if total_income > 0 else "N/A"],
        ["Transaction Count", str(len(transactions))]
    ]
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#10b981')),  # Income green
        ('TEXTCOLOR', (1, 1), (1, 1), colors.HexColor('#ef4444')),  # Expenses red
        ('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor('#10b981') if net_savings >= 0 else colors.HexColor('#ef4444')),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Category Breakdown Section
    if sorted_categories:
        elements.append(Paragraph("Spending by Category", section_style))
        
        # Category table
        cat_data = [["Category", "Amount", "% of Total"]]
        for cat_name, amount in sorted_categories[:15]:  # Top 15
            pct = (amount / total_expenses * 100) if total_expenses > 0 else 0
            cat_data.append([cat_name, f"${amount:,.2f}", f"{pct:.1f}%"])
        
        cat_table = Table(cat_data, colWidths=[3*inch, 1.5*inch, 1*inch])
        cat_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(cat_table)
    
    elements.append(PageBreak())
    
    # Transaction Details Section
    elements.append(Paragraph("Transaction Details", section_style))
    elements.append(Paragraph(
        f"Showing {min(100, len(transactions))} of {len(transactions)} transactions",
        subtitle_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    
    # Transaction table
    txn_data = [["Date", "Description", "Category", "Amount"]]
    for t in transactions[:100]:  # Limit to 100 for PDF readability
        txn_data.append([
            t.date.strftime("%Y-%m-%d") if t.date else "",
            (t.description[:40] + "...") if len(t.description) > 40 else t.description,
            (t.bucket.name if t.bucket else "Uncategorized")[:20],
            f"${t.amount:,.2f}"
        ])
    
    txn_table = Table(txn_data, colWidths=[1*inch, 3*inch, 1.3*inch, 1*inch])
    txn_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#334155')),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
    ]))
    elements.append(txn_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"DollarData_Report_{s_date.strftime('%Y%m')}_to_{e_date.strftime('%Y%m')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/report/excel")
def export_report_excel(
    start_date: str = Query(..., description="ISO Date string"),
    end_date: str = Query(..., description="ISO Date string"),
    spender: str = Query(default="Combined"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generate an Excel workbook with multiple sheets.
    Sheets: Summary, Transactions, Category Breakdown
    """
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    from openpyxl.utils import get_column_letter
    import io
    
    try:
        s_date = datetime.fromisoformat(start_date)
        e_date = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Fetch data
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= s_date,
        models.Transaction.date <= e_date
    )
    
    if spender != "Combined":
        transactions = transactions.filter(models.Transaction.spender == spender)
    
    transactions = transactions.order_by(models.Transaction.date.desc()).all()
    
    # Calculate stats
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)
    net_savings = total_income - total_expenses
    
    # Category breakdown
    category_totals = {}
    for t in transactions:
        if t.amount < 0:
            cat_name = t.bucket.name if t.bucket else "Uncategorized"
            category_totals[cat_name] = category_totals.get(cat_name, 0) + abs(t.amount)
    
    # Create workbook
    wb = Workbook()
    
    # Styles
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="5D5DFF", end_color="5D5DFF", fill_type="solid")
    border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    currency_format = '$#,##0.00'
    
    # ===== Summary Sheet =====
    ws_summary = wb.active
    ws_summary.title = "Summary"
    
    ws_summary['A1'] = "DollarData Financial Report"
    ws_summary['A1'].font = Font(bold=True, size=16)
    ws_summary['A2'] = f"Period: {s_date.strftime('%B %d, %Y')} - {e_date.strftime('%B %d, %Y')}"
    ws_summary['A3'] = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    if spender != "Combined":
        ws_summary['A4'] = f"Spender: {spender}"
    
    summary_data = [
        ("Metric", "Value"),
        ("Total Income", total_income),
        ("Total Expenses", total_expenses),
        ("Net Savings", net_savings),
        ("Savings Rate", f"{(net_savings/total_income*100):.1f}%" if total_income > 0 else "N/A"),
        ("Transaction Count", len(transactions)),
    ]
    
    for row_idx, (label, value) in enumerate(summary_data, start=6):
        ws_summary[f'A{row_idx}'] = label
        ws_summary[f'B{row_idx}'] = value
        if row_idx == 6:
            ws_summary[f'A{row_idx}'].font = header_font
            ws_summary[f'A{row_idx}'].fill = header_fill
            ws_summary[f'B{row_idx}'].font = header_font
            ws_summary[f'B{row_idx}'].fill = header_fill
        elif isinstance(value, (int, float)) and row_idx > 6:
            ws_summary[f'B{row_idx}'].number_format = currency_format
    
    ws_summary.column_dimensions['A'].width = 20
    ws_summary.column_dimensions['B'].width = 15
    
    # ===== Transactions Sheet =====
    ws_txn = wb.create_sheet("Transactions")
    
    headers = ["Date", "Description", "Amount", "Type", "Category", "Spender", "Notes"]
    for col, header in enumerate(headers, start=1):
        cell = ws_txn.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center')
    
    for row_idx, t in enumerate(transactions, start=2):
        ws_txn.cell(row=row_idx, column=1, value=t.date.strftime("%Y-%m-%d") if t.date else "")
        ws_txn.cell(row=row_idx, column=2, value=t.description)
        amount_cell = ws_txn.cell(row=row_idx, column=3, value=t.amount)
        amount_cell.number_format = currency_format
        ws_txn.cell(row=row_idx, column=4, value="Income" if t.amount > 0 else "Expense")
        ws_txn.cell(row=row_idx, column=5, value=t.bucket.name if t.bucket else "Uncategorized")
        ws_txn.cell(row=row_idx, column=6, value=t.spender or "")
        ws_txn.cell(row=row_idx, column=7, value=t.notes or "")
    
    # Auto-size columns
    for col in range(1, 8):
        ws_txn.column_dimensions[get_column_letter(col)].width = 15 if col != 2 else 40
    
    # ===== Category Breakdown Sheet =====
    ws_cat = wb.create_sheet("Category Breakdown")
    
    cat_headers = ["Category", "Amount", "% of Total"]
    for col, header in enumerate(cat_headers, start=1):
        cell = ws_cat.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
    
    sorted_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    for row_idx, (cat_name, amount) in enumerate(sorted_cats, start=2):
        ws_cat.cell(row=row_idx, column=1, value=cat_name)
        amount_cell = ws_cat.cell(row=row_idx, column=2, value=amount)
        amount_cell.number_format = currency_format
        pct = (amount / total_expenses * 100) if total_expenses > 0 else 0
        ws_cat.cell(row=row_idx, column=3, value=f"{pct:.1f}%")
    
    ws_cat.column_dimensions['A'].width = 30
    ws_cat.column_dimensions['B'].width = 15
    ws_cat.column_dimensions['C'].width = 12
    
    # Save to buffer
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    filename = f"DollarData_Report_{s_date.strftime('%Y%m')}_to_{e_date.strftime('%Y%m')}.xlsx"
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

