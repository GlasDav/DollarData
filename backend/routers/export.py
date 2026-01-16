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
    Includes: Logo, summary statistics, expense donut chart, income donut chart.
    Excludes transfers. Fits on single page.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.graphics.shapes import Drawing, String
    from reportlab.graphics.charts.piecharts import Pie
    from reportlab.graphics.charts.legends import Legend
    from reportlab.graphics.widgets.markers import makeMarker
    import io
    import os
    
    # Brand colors
    BRAND_PRIMARY = colors.HexColor('#5D5DFF')
    BRAND_SUCCESS = colors.HexColor('#10b981')
    BRAND_ERROR = colors.HexColor('#ef4444')
    TEXT_PRIMARY = colors.HexColor('#191B18')
    TEXT_MUTED = colors.HexColor('#666666')
    
    # Chart colors (matching frontend chartColors.js)
    CHART_COLORS = [
        colors.HexColor('#f59e0b'),  # Amber
        colors.HexColor('#06b6d4'),  # Cyan
        colors.HexColor('#6366f1'),  # Indigo
        colors.HexColor('#10b981'),  # Emerald
        colors.HexColor('#ec4899'),  # Pink
        colors.HexColor('#84cc16'),  # Lime
        colors.HexColor('#8b5cf6'),  # Violet
        colors.HexColor('#ef4444'),  # Red
    ]
    
    INCOME_COLORS = [
        colors.HexColor('#10b981'),  # Emerald-500
        colors.HexColor('#34d399'),  # Emerald-400
        colors.HexColor('#6ee7b7'),  # Emerald-300
        colors.HexColor('#a7f3d0'),  # Emerald-200
    ]
    
    try:
        s_date = datetime.fromisoformat(start_date)
        e_date = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Fetch transactions - EXCLUDE TRANSFERS
    transactions = db.query(models.Transaction).join(
        models.BudgetBucket, models.Transaction.bucket_id == models.BudgetBucket.id, isouter=True
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= s_date,
        models.Transaction.date <= e_date
    )
    
    # Exclude transfers (bucket name contains "transfer" case-insensitive)
    transactions = transactions.filter(
        ~models.BudgetBucket.name.ilike('%transfer%')
    )
    
    if spender != "Combined":
        transactions = transactions.filter(models.Transaction.spender == spender)
    
    transactions = transactions.all()
    
    # Calculate summary stats
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)
    net_savings = total_income - total_expenses
    
    # Expense category breakdown
    expense_categories = {}
    for t in transactions:
        if t.amount < 0:
            cat_name = t.bucket.name if t.bucket else "Uncategorized"
            expense_categories[cat_name] = expense_categories.get(cat_name, 0) + abs(t.amount)
    
    # Income category breakdown
    income_categories = {}
    for t in transactions:
        if t.amount > 0:
            cat_name = t.bucket.name if t.bucket else "Uncategorized"
            income_categories[cat_name] = income_categories.get(cat_name, 0) + t.amount
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5*cm, bottomMargin=1*cm, leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    
    # Custom styles with brand colors
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=5,
        textColor=TEXT_PRIMARY
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=TEXT_MUTED
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=8,
        textColor=BRAND_PRIMARY
    )
    
    elements = []
    
    # === Header with Logo ===
    # Try to load logo, fall back to text if not found
    logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'favicon.svg')
    try:
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=0.5*inch, height=0.5*inch)
            header_data = [[logo, Paragraph("DollarData Financial Report", title_style)]]
            header_table = Table(header_data, colWidths=[0.7*inch, 5*inch])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(header_table)
        else:
            elements.append(Paragraph("DollarData Financial Report", title_style))
    except:
        elements.append(Paragraph("DollarData Financial Report", title_style))
    
    # Period and spender info
    elements.append(Paragraph(
        f"Period: {s_date.strftime('%B %d, %Y')} to {e_date.strftime('%B %d, %Y')}",
        subtitle_style
    ))
    if spender != "Combined":
        elements.append(Paragraph(f"Spender: {spender}", subtitle_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", subtitle_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # === Summary Section ===
    elements.append(Paragraph("Financial Summary", section_style))
    
    summary_data = [
        ["Total Income", f"${total_income:,.2f}", "Net Savings", f"${net_savings:,.2f}"],
        ["Total Expenses", f"${total_expenses:,.2f}", "Savings Rate", f"{(net_savings/total_income*100):.1f}%" if total_income > 0 else "N/A"],
    ]
    summary_table = Table(summary_data, colWidths=[1.8*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), TEXT_MUTED),
        ('TEXTCOLOR', (2, 0), (2, -1), TEXT_MUTED),
        ('TEXTCOLOR', (1, 0), (1, 0), BRAND_SUCCESS),  # Income green
        ('TEXTCOLOR', (1, 1), (1, 1), BRAND_ERROR),    # Expenses red
        ('TEXTCOLOR', (3, 0), (3, 0), BRAND_SUCCESS if net_savings >= 0 else BRAND_ERROR),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('ALIGN', (3, 0), (3, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # === Helper function to create pie chart ===
    def create_pie_chart(data_dict, color_palette, title, width=180, height=180):
        """Create a pie chart drawing with legend."""
        if not data_dict:
            return None
        
        # Sort and limit to top 6
        sorted_data = sorted(data_dict.items(), key=lambda x: x[1], reverse=True)[:6]
        labels = [item[0] for item in sorted_data]
        values = [item[1] for item in sorted_data]
        
        drawing = Drawing(width, height + 60)
        
        # Add title
        drawing.add(String(width/2, height + 45, title, 
                          textAnchor='middle', fontSize=12, fillColor=TEXT_PRIMARY))
        
        # Pie chart
        pie = Pie()
        pie.x = 20
        pie.y = 40
        pie.width = width - 40
        pie.height = height - 40
        pie.data = values
        pie.labels = None  # We'll use legend instead
        pie.slices.strokeWidth = 1
        pie.slices.strokeColor = colors.white
        
        for i in range(len(values)):
            pie.slices[i].fillColor = color_palette[i % len(color_palette)]
        
        drawing.add(pie)
        
        # Add simple legend below
        legend_y = 25
        total = sum(values)
        for i, (label, value) in enumerate(sorted_data[:3]):  # Show top 3 in legend
            pct = (value / total * 100) if total > 0 else 0
            short_label = label[:15] + "..." if len(label) > 15 else label
            legend_text = f"{short_label}: {pct:.0f}%"
            drawing.add(String(10 + (i * 60), legend_y, legend_text[:10], 
                              fontSize=7, fillColor=TEXT_MUTED))
        
        return drawing
    
    # === Charts Section - Side by Side ===
    elements.append(Paragraph("Spending & Income Breakdown", section_style))
    
    # Create expense pie chart
    expense_chart = create_pie_chart(expense_categories, CHART_COLORS, "Expenses by Category")
    income_chart = create_pie_chart(income_categories, INCOME_COLORS, "Income by Source")
    
    # Create side-by-side layout for charts
    if expense_chart or income_chart:
        chart_data = [[
            expense_chart if expense_chart else "",
            income_chart if income_chart else ""
        ]]
        chart_table = Table(chart_data, colWidths=[3.2*inch, 3.2*inch])
        chart_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(chart_table)
    
    elements.append(Spacer(1, 0.3*inch))
    
    # === Category Tables - Side by Side ===
    # Expense categories table
    exp_sorted = sorted(expense_categories.items(), key=lambda x: x[1], reverse=True)[:8]
    inc_sorted = sorted(income_categories.items(), key=lambda x: x[1], reverse=True)[:8]
    
    # Build expense column
    exp_data = [["Category", "Amount", "%"]]
    for cat_name, amount in exp_sorted:
        pct = (amount / total_expenses * 100) if total_expenses > 0 else 0
        exp_data.append([cat_name[:20], f"${amount:,.0f}", f"{pct:.0f}%"])
    
    # Build income column  
    inc_data = [["Category", "Amount", "%"]]
    for cat_name, amount in inc_sorted:
        pct = (amount / total_income * 100) if total_income > 0 else 0
        inc_data.append([cat_name[:20], f"${amount:,.0f}", f"{pct:.0f}%"])
    
    # Pad to same length
    while len(exp_data) < len(inc_data):
        exp_data.append(["", "", ""])
    while len(inc_data) < len(exp_data):
        inc_data.append(["", "", ""])
    
    exp_table = Table(exp_data, colWidths=[1.6*inch, 0.8*inch, 0.5*inch])
    exp_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_ERROR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    inc_table = Table(inc_data, colWidths=[1.6*inch, 0.8*inch, 0.5*inch])
    inc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_SUCCESS),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    # Side by side tables
    tables_data = [[exp_table, Spacer(0.2*inch, 0), inc_table]]
    tables_layout = Table(tables_data, colWidths=[3*inch, 0.3*inch, 3*inch])
    tables_layout.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(tables_layout)
    
    # === Footer ===
    elements.append(Spacer(1, 0.4*inch))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=TEXT_MUTED, alignment=1)
    elements.append(Paragraph("Generated by DollarData • dollardata.au", footer_style))
    
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

