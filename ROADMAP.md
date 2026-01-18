# DollarData - Feature Roadmap

This document outlines the planned features, improvements, and future direction for the DollarData application.

> **Note:** This is a living document derived from project notes and user feedback.

---

## 💸 Transactions & Integrations

- [ ] **Transaction Notes:** Add ability to annotate transactions with custom notes (pending Basiq integration).
- [/] **Basiq Integration:** Full bank feed integration for automatic transaction import.
  - [x] Research existing implementation and create implementation plan
  - [ ] Create shared ingestion utilities (`ingestion_utils.py`)
  - [ ] Update `connections.py` with full ingestion pipeline
  - [ ] Add Open Banking filter to `ConnectBank.jsx`
- [ ] **Amazon Extension:** Browser extension or integration to categorize Amazon purchases automatically.

## 📊 Reports & Analytics
- [ ] **Filtered Reports:** Advanced filtering (tags, dates, categories, accounts) for custom reports.
- [ ] **Monthly Expense Breakdown:** Clickable monthly totals to drill down into expense specifics.

## 💰 Budget & Goals

- [ ] **Household vs Individual:** Explore options to have some goals and achievements at household level, and some for individual members.

## 🏦 Net Worth & Assets

- [ ] **Asset Split (Overview):** Distinguish between ETFs and stocks in Asset Allocation chart.
- [ ] **Asset Split (Investments):** Distinguish between stocks and ETFs in Investments tab.
- [ ] **HECS Debt:** Add HECS debt account type/calculator.

## ⚙️ Account & Settings

- [ ] **Family Invites:** Email invitation flow for new household members (create own login for same account).
- [ ] **Security (MFA):** Multi-Factor Authentication setup.
- [x] **Email Verification:** Verify user email addresses for security.
- [ ] **Notifications Overhaul:** Fix currently broken notifications system and improve customization.
- [x] **Delete Account:** Allow users to permanently delete their account and data (GDPR compliance).
- [x] **Account Creation Stability:** Fixed 504 timeouts and database locks during signup.

## 🎨 UI/UX Improvements

- [x] **Tutorial System:** In-app walkthrough using React Joyride.
  - [x] User documentation created (`docs/ONBOARDING_TUTORIAL.md`)
  - [x] **Phase 1 (MVP):** Setup Tour (Modules 1-4)
    - [x] Install `react-joyride` package
    - [x] Create `TutorialContext.jsx` provider
    - [x] Implement setup tour steps (Categories → Rules → Import)
    - [x] Add `data-tour` attributes to navigation & Budget page
    - [x] Integrate with existing `OnboardingWizard.jsx`
    - [x] Enable `spotlightClicks` for interactive tour
    - [x] Add "Help" tab to Settings with restart button
    - [x] Checklist summary on final step
    - [x] **Fix:** Resolved scroll-locking bug and removed problematic steps
  - [ ] **Phase 2:** Dashboard & Core Features
    - [ ] Dashboard tour (widget explanations)
    - [ ] Net Worth tour
    - [ ] `TutorialLauncher.jsx` help menu component
  - [ ] **Phase 3:** Advanced Features
    - [ ] Budgeting tour
    - [ ] Goals & Achievements tour
    - [ ] Reports & Analytics tour
    - [ ] Contextual tooltips for complex features
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
