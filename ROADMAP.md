# DollarData - Feature Roadmap

This document outlines the planned features, improvements, and future direction for the DollarData application.

> **Note:** This is a living document derived from project notes and user feedback.

---

## 💸 Transactions & Integrations

- [ ] **Transaction Notes:** Add ability to annotate transactions with custom notes (pending Basiq integration).
- [ ] **Basiq Integration:** Full bank feed integration for automatic transaction import.
- [ ] **Amazon Extension:** Browser extension or integration to categorize Amazon purchases automatically.

## 📊 Reports & Analytics

- [ ] **Income by Type:** Detailed breakdown of income sources.
- [ ] **Filtered Reports:** Advanced filtering (tags, dates, categories, accounts) for custom reports.
- [ ] **Monthly Expense Breakdown:** Clickable monthly totals to drill down into expense specifics.
- [ ] **Professional Exports:** High-quality PDF/Excel reports suitable for sharing with accountants/banks.
- [ ] **Cash Flow Forecast Overhaul:** Improve forecasting methodology using budget categories for better accuracy.

## 💰 Budget & Goals

- [ ] Rename "Goals" page to "Goals & Achievements" in sidebar
- [ ] Fix Savings and Income achievements logic for correct calculation

## 🏦 Net Worth & Assets

- [ ] **Asset Split (Overview):** Distinguish between ETFs and stocks in Asset Allocation chart.
- [ ] **Asset Split (Investments):** Distinguish between stocks and ETFs in Investments tab.
- [ ] **HECS Debt:** Add HECS debt account type/calculator.
- [x] **Trade Logic:** Rename 'Add Investment' to 'Add Trade', add trade date, and implement Buy/Sell/Dividend/DRIP logic with CSV import.
- [x] **Test Investments Logic:** Thoroughly test new trade functionality (Fixed Cost Basis bug).
- [x] **Accounts Tab Bug:** Fix "Add Account" button not working on Accounts tab in Net Worth page.
- [x] **Trade Management:** Added ability to View, Edit, and Delete trades with automatic holding recalculation.

## ⚙️ Account & Settings

- [ ] **Configure dollardata.au Domain:**
  - [ ] Complete GoDaddy ID verification
  - [ ] Add A records pointing to VPS (43.224.182.196)
  - [ ] Install Caddy on VPS for auto-SSL
  - [ ] Update CORS_ORIGINS in .env
- [ ] **Family Invites:** Email invitation flow for new household members (create own login for same account).
- [ ] **Security (MFA):** Multi-Factor Authentication setup.
- [ ] **Email Verification:** Verify user email addresses for security.
- [ ] **Notifications Overhaul:** Fix currently broken notifications system and improve customization.

## 🎨 UI/UX Improvements

- [ ] **Tutorial System:**
    - Skip/Exit option.
    - Pre-import guidance (Categories & Rules setup first).
    - Comprehensive guide covering all features.
    - Help/FAQ section.
- [x] **Dashboard Redesign:** Implement "ZenFinance" 2-column layout and new widgets.
- [x] **Dashboard Refinements:** Polish Cash Flow, Achievements, and Reporting widgets.
- [x] **Public Landing Page:** Design landing page for unauthenticated users.
  - [ ] Fix up landing page spacing
  - [ ] Polish landing page content
- [ ] **Revamp Quick Add Button:** Redesign the quick add button for better UX.

## 🚀 Commercialization

- [ ] **Tiered Subscriptions:** Implement Free/Pro/Family tiers.
- [ ] **Free Trial:** Implement free trial logic.
- [ ] **Referral System:** User referral links and tracking.

## 📱 Mobile App

- [ ] **Plan iOS and Android App:** Research and plan capabilities for native apps.

## 📊 Data Enhancements

- [ ] **Link Transactions to Accounts:** Capture `account_id` during CSV/bank imports to enable account-based filtering in Reports.
- [ ] **Tag Management:** Build UI for creating and managing transaction tags.

## 🐛 Known Bugs

- [ ] **Notifications 500 Error:** Fix `/api/notifications/` endpoint returning 500 Internal Server Error.
- [ ] **Transactions 405 Error:** Fix `/api/transactions/?limit=1` returning 405 Method Not Allowed (trailing slash routing issue).

