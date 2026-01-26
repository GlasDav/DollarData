# DollarData User Guide

> Your complete guide to mastering personal finance with DollarData.

Welcome to DollarData! This guide will walk you through everything you need to know—from your first login to advanced analytics. Each module is designed to be self-contained, so feel free to skip ahead or revisit sections as needed.

**💡 Pro Tip:** You can skip any step by clicking the "Skip" button. We recommend following the order below for the best experience, especially if you're new to the app.

---

## Table of Contents

1. [Getting Started](#module-1-getting-started)
2. [Setting Up Your Categories](#module-2-setting-up-your-categories)
3. [Creating Smart Rules](#module-3-creating-smart-rules)
4. [Importing Your Transactions](#module-4-importing-your-transactions)
5. [Net Worth & Accounts](#module-5-net-worth--accounts)
6. [Understanding Your Dashboard](#module-6-understanding-your-dashboard)
7. [Budgeting Like a Pro](#module-7-budgeting-like-a-pro)
8. [Goals & Achievements](#module-8-goals--achievements)
9. [Reports & Analytics](#module-9-reports--analytics)

---

## Module 1: Getting Started

<!-- Route: /dashboard (OnboardingWizard.jsx) -->
<!-- Components: OnboardingWizard.jsx, HouseholdSettings.jsx, AccountInfoSettings.jsx -->

### 1.1 Welcome to DollarData

After signing up, you'll need to **verify your email address** via the link sent to your inbox. Once verified, log in to land on your personal Dashboard. If this is your first time, a welcome wizard will guide you through the essentials.

**What happens during setup:**
- Optionally add household members (partner, family)
- Get pointed toward your first data import

### 1.2 Solo or Household?

DollarData works great for individuals and families alike.

**For Solo Users:**
- Skip the household setup
- All transactions and budgets are yours alone
- Perfect for tracking personal finances

**For Households:**
- Add your partner or family members
- Assign transactions to specific people
- Split budgets between household members
- See combined or individual spending views

**To add household members later:**
1. Go to **Settings** → **Account**
2. Scroll to "Household Members"
3. Click **Add Member** and enter their name
4. Assign a color for easy identification on charts

### 1.3 Configuring Your Preferences

Before diving in, take a moment to personalize your experience. Access these settings by clicking the **Menu icon** (top left) to open the navigation drawer.

| Setting | Location | What It Does |
|---------|----------|--------------|
| Theme | Drawer footer | Switch between light and dark mode |
| Notifications | Settings → Notifications | Control email and in-app alerts |

### 1.4 Managing Your Data

You have full control over your data.

**To delete your account:**
1. Go to **Settings** → **Data Management**
2. Scroll to the "Danger Zone"
3. Click **Delete Account**
4. Type "DELETE" to confirm
5. **Warning:** This permanently wipes all your data, including households you own.

---

## Module 2: Setting Up Your Categories

<!-- Route: /budget (Categories tab) -->
<!-- Components: BucketTableSection.jsx, Budget.jsx -->

> ⚠️ **Important:** Set up your categories **before** importing transactions. This ensures your data is organized from the start and saves you hours of manual categorization later.

### 2.1 Understanding Categories

DollarData organizes your spending into a hierarchical category system. Categories are grouped into three types:

| Group | Purpose | Examples |
|-------|---------|----------|
| **Non-Discretionary** | Essential expenses you can't easily avoid | Rent, Utilities, Insurance, Groceries |
| **Discretionary** | Lifestyle spending you have control over | Dining Out, Entertainment, Shopping |
| **Income** | Money coming in | Salary, Freelance, Dividends |

### 2.2 The Default Categories

DollarData comes preloaded with common categories to get you started:

**Non-Discretionary (Needs):**
- Housing (Rent/Mortgage, Utilities, Maintenance)
- Transport (Fuel, Public Transit, Car Insurance)
- Food (Groceries)
- Health (Medical, Pharmacy, Insurance)
- Financial (Bank Fees, Subscriptions)

**Discretionary (Wants):**
- Dining Out
- Entertainment (Streaming, Events, Hobbies)
- Shopping (Clothing, Electronics, Home)
- Personal Care
- Travel

**Income:**
- Salary
- Freelance/Side Hustle
- Investments
- Reimbursements

### 2.3 Customizing Your Categories

To add, edit, or remove categories:

1. Navigate to **Budget** → **Categories** tab
2. Find the group you want to modify (Non-Disc, Disc, or Income)
3. Click the **+ Add Category** button at the bottom of a group
4. Enter a name and optionally set a monthly budget limit
5. Drag categories to reorder them

**Creating Subcategories:**

Subcategories help you drill down into spending. For example:
- **Food** (parent)
  - Groceries (subcategory)
  - Dining Out (subcategory)
  - Coffee (subcategory)

To create a subcategory:
1. Click the **+** icon next to any existing category
2. Enter the subcategory name
3. The subcategory inherits its parent's group (Needs/Wants)

### 2.4 Tips for Effective Categories

✅ **Do:**
- Keep parent categories broad (e.g., "Transport")
- Use subcategories for specifics (e.g., "Fuel", "Parking", "Tolls")
- Create an "Other" category for one-off expenses

❌ **Don't:**
- Create too many top-level categories (aim for 8-12)
- Make categories too specific (e.g., "Tuesday Coffee at Starbucks")
- Delete categories with existing transactions (reassign them first)

---

## Module 3: Creating Smart Rules

<!-- Route: /budget (Rules tab) -->
<!-- Components: RulesSection.jsx, CreateRuleModal.jsx -->

> ⚠️ **Important:** Set up smart rules **before** importing transactions. Rules automatically categorize incoming transactions, saving you significant time.

### 3.1 What Are Smart Rules?

Smart Rules automatically categorize transactions based on keywords in the description. When you import transactions (or connect a bank), any transaction matching a rule gets categorized instantly.

**Example:**
- Rule: If description contains "WOOLWORTHS" → Assign to "Groceries"
- Result: Every Woolworths transaction is auto-categorized

### 3.2 Creating Your First Rule

1. Go to **Budget** → **Rules** tab
2. Click **Create Rule** (or use the form at the top)
3. Enter your rule details:
   - **Keywords:** Words to match (e.g., "NETFLIX, Netflix, Netflix.com")
   - **Category:** Where matching transactions go
   - **Assigned To:** (Optional) Which household member
   - **Amount Range:** (Optional) Only match within a price range
4. Click **Save Rule**

### 3.3 Rule Matching Tips

Rules match based on keywords in the transaction description. Here's how to write effective rules:

| Scenario | Keyword(s) | Why It Works |
|----------|------------|--------------|
| Streaming services | `NETFLIX, SPOTIFY, DISNEY+` | Matches exact service names |
| Supermarkets | `WOOLWORTHS, COLES, ALDI` | Catches all grocery stores |
| Coffee shops | `CAFE, COFFEE, STARBUCKS` | Broad + specific matching |
| Fuel stations | `BP, SHELL, CALTEX, 7-ELEVEN` | Major fuel brands |

**Pro Tips:**
- Use uppercase for bank-style descriptions (banks often use ALL CAPS)
- Include variations (e.g., "UBER, Uber, UBER EATS, UberEats")
- Check the "Preview" button to see which existing transactions would match

### 3.4 Rule Priority

Rules are processed in order from top to bottom. If a transaction matches multiple rules, the **first** matching rule wins.

**To reorder rules:**
- Drag the grip handle (⋮⋮) on the left of each rule
- Move more specific rules above general ones

**Example priority:**
1. "UBER EATS" → Dining Out *(specific)*
2. "UBER" → Transport *(general)*

This ensures Uber Eats orders go to Dining, while Uber rides go to Transport.

### 3.5 Running Rules on Existing Transactions

Already imported transactions before setting up rules? No problem!

1. Go to **Budget** → **Rules** tab
2. Click **Run Rules** (play button icon)
3. Choose whether to overwrite existing categories or only update uncategorized transactions
4. Click **Confirm**

---

## Module 4: Importing Your Transactions

<!-- Route: /data-management -->
<!-- Components: DataManagement.jsx, ConnectBank.jsx -->

Now that your categories and rules are ready, it's time to bring in your data!

### 4.1 Import Methods

DollarData supports multiple ways to get your transactions in:

| Method | Best For | Setup Time |
|--------|----------|------------|
| **CSV Upload** | Bank exports, historical data | 5 minutes |
| **PDF Statement** | Bank statements (AI-parsed) | 5 minutes |
| **Bank Connection** | Automatic ongoing sync | 10 minutes |
| **Manual Entry** | One-off transactions | 1 minute |

### 4.2 Importing from CSV

Most banks let you export transactions as CSV files. Here's how to import them:

1. Navigate to **Data Management** (via sidebar or quick menu)
2. Click **Upload CSV**
3. Select your CSV file
4. DollarData will auto-detect columns (date, amount, description)
5. Review the preview—transactions matching your rules will be pre-categorized
6. If you have household members, select who this import belongs to
7. Click **Import Transactions**

**Supported CSV Formats:**
- Standard bank exports (Date, Description, Amount)
- Credit card statements
- Custom formats (you can map columns manually)

### 4.3 Importing from PDF Statements

For PDF bank statements, DollarData uses AI to extract transactions:

1. Go to **Data Management**
2. Click **Upload PDF**
3. Select your bank statement PDF
4. Review the extracted transactions
5. Confirm the import

**Note:** PDF parsing works best with standard Australian bank statement formats. Complex or image-based PDFs may require manual review.

### 4.4 Connecting Your Bank (Optional)

For automatic, ongoing transaction sync:

1. Go to **Data Management** → **Connect Bank**
2. Click **Connect a Bank**
3. Search for your bank and log in securely via Basiq
4. Select which accounts to sync
5. Transactions will import automatically going forward

**Security:** Bank connections use Basiq's secure open banking API. DollarData never stores your bank login credentials.

### 4.5 Reviewing Imported Transactions

After importing, you should review your transactions:

1. Go to **Transactions** page
2. Look for transactions marked as "Uncategorized" (highlighted)
3. Click on a transaction to assign a category
3. Click on a transaction to assign a category
4. Use the filters to refine your view:
   - **Date:** Filter by specific date range
   - **Amount:** Find transactions within a price range (matches both income and expenses)
   - **Category/Spender:** Standard filters

**Bulk Actions:**
- Select multiple transactions with checkboxes
- Use the bulk action menu to:
  - Assign all to a category
  - Delete selected
  - Mark as verified

### 4.6 Adding Manual Transactions

For cash purchases or transactions not in your bank:

1. Click the **Quick Add** button (floating action button, bottom-right)
2. Or go to **Transactions** → **Add Transaction**
3. Fill in the details:
   - Date
   - Description
   - Amount (positive for income, negative for expenses)
   - Category
   - (Optional) Household member
4. Click **Save**

---

## Module 5: Net Worth & Accounts

<!-- Route: /net-worth -->
<!-- Components: NetWorth.jsx, AddAccountModal.jsx, InvestmentsTab.jsx -->

Track your complete financial picture beyond just spending.

### 5.1 Understanding Net Worth

Your net worth is calculated as:

**Net Worth = Total Assets − Total Liabilities**

DollarData tracks this over time so you can see your financial progress.

### 5.2 Adding Accounts

To get an accurate net worth, add all your financial accounts:

1. Go to **Net Worth** page
2. Click **Add Account**
3. Select the account type:
   - **Cash** – Everyday/savings accounts
   - **Investment** – Brokerage, shares, ETFs
   - **Property** – Real estate value
   - **Superannuation** – Retirement funds
   - **Other Asset** – Vehicles, valuables
   - **Credit Card** – Credit card balances
   - **Mortgage** – Home loans
   - **Other Liability** – Personal loans, HECS

4. Enter the account name and current balance
5. Click **Save**

### 5.3 Updating Account Balances

Account balances don't update automatically (except bank-connected accounts). Update them monthly:

1. Go to **Net Worth**
2. Click on an account card
3. Enter the new balance
4. The change is logged in your history

**Using the Spreadsheet View:**
You can also update balances directly in the **History** tab:
- Click firmly on any amount cell to edit it inline
- Click on an account name to open the details modal
- **HECS/HELP Debt:** HECS accounts have a special calculator icon. Click the account name to access the indexation and repayment calculator.

**💡 Tip:** Set a monthly reminder to update all account balances on the same day (e.g., the 1st of each month) for consistent tracking.

### 5.4 Investment Accounts & Trades

For investment accounts, DollarData tracks individual holdings:

**Adding a Trade:**
1. Go to **Net Worth** → **Investments** tab
2. Click **Add Trade**
3. Select:
   - Trade Type (Buy, Sell, Dividend, DRIP)
   - Ticker symbol (e.g., VAS.AX for Vanguard Australian Shares)
   - Date, Quantity, Price
4. DollarData calculates your cost basis and returns

**Importing Trades from CSV:**
1. Click **Import Trades**
2. Upload a CSV with columns: Date, Type, Ticker, Quantity, Price
3. Review and confirm

**Viewing Holdings:**
- Click on any holding to see trade history
- Returns are calculated as: Current Value − Cost Basis

### 5.5 Net Worth History

DollarData creates monthly snapshots of your net worth:

1. Go to **Net Worth** → **History** tab
2. See your net worth trend over time
3. Toggle between "Simple" (total only) and "Breakdown" (by asset type)
4. The breakdown chart shows how each category contributes to your wealth

---

## Module 6: Understanding Your Dashboard

<!-- Route: /dashboard -->
<!-- Components: Dashboard.jsx, widgets/*.jsx -->

Your Dashboard is your financial command center. Here's what each widget shows you.

### 6.1 Dashboard Layout

The Dashboard uses a two-column layout:

**Left Column (Main):**
- Summary Cards (Income, Expenses, Savings, Net Worth)
- Cash Flow Trend (chart)
- Budget Progress
- Recent Transactions

**Right Column (Sidebar):**
- Safe to Spend widget
- Upcoming Bills
- Smart Insights
- Goals Progress
- Achievements

### 6.2 Key Widgets Explained

| Widget | What It Shows | How to Use It |
|--------|---------------|---------------|
| **Safe to Spend** | Money available after bills | Budget for discretionary spending |
| **Cash Flow Trend** | Income vs. expenses over time | Spot spending patterns |
| **Budget Progress** | Category spending vs. limits | Stay within budgets |
| **Net Worth** | Current net worth + trend + asset split | Track wealth growth and allocation |
| **Recent Transactions** | Latest 5 transactions | Quick review of activity |
| **Upcoming Bills** | Bills due this month | Avoid missed payments |
| **Smart Insights** | AI-generated observations | Actionable recommendations |
| **Achievements** | Your progress badges | Stay motivated |

### 6.3 The Time Period Selector

Use the dropdown at the top of the Dashboard to change the time period:

- **This Month** – Current month to date
- **Last Month** – Previous full month
- **Last 3 Months** – Rolling quarter
- **Last 6 Months** – Half-year view
- **Last 12 Months** – Full year view
- **This Year** – January 1st to today
- **Custom** – Pick your own date range

The selected period affects all widgets on the Dashboard.

### 6.4 Filtering by Household Member

If you have household members, use the member filter to view:

- **Combined** – Everyone's transactions together
- **Joint** – Only shared/joint transactions
- **[Name]** – Individual member's transactions only

---

## Module 7: Budgeting Like a Pro

<!-- Route: /budget -->
<!-- Components: Budget.jsx, BudgetProgressTab.jsx, BudgetPerformanceTab.jsx -->

Turn your categories into actionable budgets.

### 7.1 Setting Budget Limits

To set a monthly budget for a category:

1. Go to **Budget** → **Categories** tab
2. Find the category you want to budget
3. Click the budget limit field (or pencil icon)
4. Enter your monthly limit
5. The limit saves automatically

**Household Budgets:**
If you have members, you can split budgets:
- Click the member allocation column
- Assign percentages or fixed amounts per member

### 7.2 Budget Progress Tab

The **Progress** tab shows real-time spending against your budgets:

- **Progress bars** – Visual spending vs. limit
- **Color coding:**
  - 🟢 Green: Under 80% spent
  - 🟡 Yellow: 80-100% spent
  - 🔴 Red: Over budget
- **Remaining amount** – How much you have left

### 7.3 Budget Performance Tab

The **Performance** tab is a spreadsheet-style view showing:

- 12 months of historical spending per category
- Average spend per category
- Variance from average
- Click any month to see transactions

**Use this to:**
- Identify seasonal spending patterns
- Set realistic budgets based on actual behavior
- Spot categories that need attention

---

## Module 8: Goals & Achievements

<!-- Route: /goals -->
<!-- Components: Goals.jsx, AchievementsTab.jsx -->

Set financial goals and celebrate your wins.

### 8.1 Creating Savings Goals

1. Go to **Goals & Achievements**
2. Click **Add Goal**
3. Fill in the details:
   - Name (e.g., "Emergency Fund", "Vacation", "New Car")
   - Target amount
   - Target date (optional)
   - Link to an account (optional – for automatic tracking)
4. Click **Save**

### 8.2 Tracking Goal Progress

Goals are tracked in two ways:

**Manual Contributions:**
- Click on a goal
- Click **Add Contribution**
- Enter the amount and date

**Linked Accounts:**
- Link a goal to a savings account
- Progress updates automatically when you update the account balance

### 8.3 The Achievements System

Achievements gamify your financial journey. There are 8 categories, each with 8 tiers (Wood → Champion):

| Category | What It Tracks |
|----------|----------------|
| **Budget Master** | Staying within budget limits |
| **Emergency Fund** | Months of expenses saved |
| **Income Growth** | Total cumulative income |
| **Investment Growth** | Portfolio size |
| **Net Worth** | Wealth milestones |
| **Organization** | Categories and rules created |
| **Consistency** | Weeks of active usage |
| **Goal Crusher** | Goals completed |

**Tier Progression:**
- 🪵 Wood → 🪨 Stone → ⚙️ Iron → ⚜️ Bronze → 🥈 Silver → 🥇 Gold → 💎 Diamond → 👑 Champion

View your achievements in **Goals & Achievements** → **Achievements** tab.

---

## Module 9: Reports & Analytics

<!-- Route: /reports -->
<!-- Components: ReportsHub.jsx, Reports.jsx, SankeyChart.jsx, Insights.jsx, CashFlowForecast.jsx -->

Dive deep into your financial data.

### 9.1 Spending Reports (Overview Tab)

The **Overview** tab provides visual breakdowns of your spending:

- **Pie Charts** – Spending by category
- **Bar Charts** – Comparisons over time
- **Drill-down** – Click any chart segment to see underlying transactions
- **Filters** – Date range, category, member

### 9.2 Cash Flow Diagram

The **Cash Flow** tab shows a Sankey diagram visualizing money flow:

- **Left side:** Income sources
- **Middle:** Budget groups (Needs, Wants, Savings)
- **Right side:** Individual categories

**Use this to:**
- See the big picture of where money goes
- Identify which groups consume most income
- Toggle "Exclude One-offs" to filter irregular expenses

### 9.3 Calendar View

The **Calendar** tab shows transactions on a monthly calendar:

- Daily totals visible at a glance
- Click any day to see that day's transactions
- Daily totals visible at a glance
- Click any day to see that day's transactions
- Color coding for income (green) vs. expenses (red)
- **Smart Legend:** Transactions are grouped by their main category (e.g., "Food") to keep the view clean. Hover over dots to see specific details.

### 9.4 AI Insights

The **Insights** tab provides AI-powered observations:

- **Anomaly Detection** – Unusual spending flagged
- **Savings Opportunities** – Areas where you could cut back
- **Trend Alerts** – Changes in spending patterns

### 9.5 Cash Flow Forecast

View your projected financial future:

1. Go to **Reports** → **Overview** tab
2. Scroll to the **Cash Flow Forecast** section
3. See 12-month projections based on your budgets

The forecast shows:
- Monthly projected balances
- Net monthly cash flow
- Warning if you'll go negative

### 9.6 Exporting Reports

Generate professional reports for your records or tax time:

**PDF Export:**
1. Go to **Reports** → **Overview**
2. Set your desired date range
3. Click **Export PDF**
4. A branded PDF with charts and tables downloads

**Excel Export:**
1. Same process as PDF
2. Click **Export Excel**
3. Raw data opens in your spreadsheet app

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open Command Palette |
| `Ctrl+N` | New Transaction |
| Arrow keys | Navigate in tables |

### Common Questions

**Q: How do I change a transaction's category?**
A: Click the transaction in the Transactions page, then select a new category from the dropdown.

**Q: Can I undo a deleted transaction?**
A: No, deletions are permanent. Consider using the "verified" checkbox instead to mark processed transactions.

**Q: How often should I update account balances?**
A: We recommend monthly, on the same day each month for consistent net worth tracking.

**Q: What's the difference between Categories and Rules?**
A: Categories are the buckets transactions go into. Rules automatically assign transactions to categories based on keywords.

**Q: Can I share DollarData with my partner?**
A: Yes! Use household members to track spending by person while sharing the same dashboard.

---

## Need More Help?

- 📧 **Contact Support:** Use the feedback button in the app
- 🐛 **Report a Bug:** Feedback → Bug Report
- 💡 **Feature Request:** Feedback → Feature Request

---

*Last updated: January 2026*
