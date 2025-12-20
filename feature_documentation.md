# Principal Finance - Feature Documentation

This document provides a comprehensive overview of the features currently implemented in the Principal Finance application.

## 1. Dashboard & Analytics
The dashboard serves as the central hub for financial oversight.

-   **Cash Flow Sankey Diagram**: A dynamic visual representation of money flow.
    -   **3-Layer Hierarchy**: Income → Groups (Discretionary/Non-Discretionary) → Buckets.
    -   **Dynamic Sizing**: Automatically adjusts height based on the number of categories to prevent overflow.
    -   **Empty State Handling**: Gracefully handles periods with no data.
-   **Summary Cards**: High-level metrics for the selected period.
    -   Total Income
    -   Total Expenses
    -   Net Savings
    -   Net Worth (Real-time snapshot)
-   **Spending Trends**: Bar chart visualizing spending over time, with filters for specific budget categories.
-   **Global Filtering**: Date range (e.g., "This Month") and Spender (Combined, You, Partner) filters affect all dashboard data.

## 2. Core Banking
### Transactions
-   **Comprehensive List**: View all transactions with dates, descriptions, categories, and amounts.
-   **Split Transactions**: Ability to split a single transaction into multiple categories (accessible via hover/select).
-   **Filtering & Sorting**: Sort by date, amount, or filter by specific criteria.

### Data Import (Ingest)
-   **Connect Bank**: Integrated button to link financial institutions (via Basiq/ConnectBank component).
-   **File Import**: Support for manual file uploads.
    -   **PDF Statements**: Extract transactions from bank PDFs.
    -   **CSV Import**: Map and import CSV data from other sources.

## 3. Wealth Management
### Net Worth
-   **Dual Views**: Toggle between "Net Worth" (Assets - Liabilities) and "Investments" (Performance history) charts.
-   **Automated Market Values**: Stock and ETF holdings are automatically updated via Yahoo Finance every time the page is loaded.
-   **Accounts List**:
    -   **Assets**: Savings, Investments, Cash.
    -   **Liabilities**: Credit Cards, Loans, Mortgages.
-   **Manual Accounts**: Ability to manually add and update account balances (via Check-In).

### Debt Payoff Visualizer
-   **Projections**: Visualizes debt payoff timelines based on current payments.
-   **Simulations**: Estimates interest and time saved by increasing monthly repayments.

### Investments
-   **Performance Tracking**: Historical view of investment portfolio value.
-   **Ticker Search**: Functionality to look up and add investment holdings (stocks/ETFs).

## 4. Planning & Budgeting
### Financial Calendar
-   **Monthly View**: specialized calendar view for financial planning.
-   **Projected Bills**: Automatically maps recurring subscriptions and bills to specific days.
-   **Cash Flow Forecasting**: Helps visualize upcoming heavy spending days.

### Subscriptions
-   **Active Management**: List of known recurring subscriptions.
-   **Discovery**: Automatically detects potential subscriptions from transaction history.
-   **Editing**: Modify subscription details (Name, Amount, Frequency, Next Due Date).

### Goals
-   **Goal Creation**: Set specific financial targets with deadlines.
-   **Tracking Modes**:
    -   **Manual**: Track progress by assigning transactions.
    -   **Linked Account**: Automatically tracks the balance of a specific asset account (e.g., "Holiday Savings Account").
-   **Progress Visualization**: Progress bars indicating completion percentage and remaining amount.

## 5. System & Settings
### Budget Configuration
-   **Categories & Groups**: Manage high-level groups (Income, Discretionary, Non-Discretionary).
-   **Buckets**: Create and edit specific spending buckets (e.g., Groceries, Rent) within groups.

### Applications Settings
-   **Couple Mode**: Toggle to enable features for shared finances (Partner A / Partner B distinction).
-   **User Profile**: Manage user details and preferences.
-   **Tax Settings**: Configure tax residency and deductions for accurate net income calculations.

## 6. Authentication & Security
-   **User Accounts**: Secure Login and Registration flows using Argon2 password hashing.
-   **Session Management**:
    -   **Short-lived Access Tokens**: Access tokens expire after 60 minutes for enhanced security.
    -   **Refresh Tokens**: Long-lived refresh tokens (7 days) allow seamless sessions while maintaining high rotate frequency for access keys.
    -   **Automatic Token Rotation**: The frontend automatically detects expired sessions and refreshes them in the background.
-   **Environment Configuration**: Sensitive data like `SECRET_KEY` and API credentials are managed via `.env` files and never hardcoded.
