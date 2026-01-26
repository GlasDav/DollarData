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

## 🎨 UI/UX Improvements

- [ ] **Household vs Individual:** Explore options to have some goals and achievements at household level, and some for individual members.

## 🏦 Net Worth & Assets

- [ ] **Asset Split (Overview):** Distinguish between ETFs and stocks in Asset Allocation chart.
- [ ] **Asset Split (Investments):** Distinguish between stocks and ETFs in Investments tab.

## ⚙️ Account & Settings

- [ ] **Family Invites:** Email invitation flow for new household members (create own login for same account).
- [ ] **Security (MFA):** Multi-Factor Authentication setup.
- [ ] **Notifications Overhaul:** Fix currently broken notifications system and improve customization.

## 🎨 UI/UX Improvements

- [ ] **Tutorial System:** In-app walkthrough using React Joyride.
  - [x] User documentation created (`docs/ONBOARDING_TUTORIAL.md`)
  - [x] **Phase 1 (MVP):** Setup Tour (Modules 1-4)
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

- [ ] **Mobile App Implementation**
  - [x] **Phase 1: Setup & Backbone:** Init Expo, NativeWind, AuthContext, API Client.
  - [x] **Phase 2: Core Screens:** Login & Register, 5-Tab Navigation, Real Dashboard Data.
  - [x] **Phase 3: Widgets & Data:**
  - [x] **Phase 4: Optimization & Polish:**
    - [ ] **Google Login:** Add Google Sign-In to mobile app.
    - [ ] **Branding:** Align mobile app brand guidelines with web app (fonts, exact colors).
    - [ ] **Logo:** Make logo bigger on sign-in page.
    - [ ] **Rotation:** Fix/Smooth out rotation behavior on dashboard.
    - [ ] Native specific interactions, scroll views, safe areas.

## 📊 Data Enhancements

- [ ] **Link Transactions to Accounts:** Capture `account_id` during CSV/bank imports to enable account-based filtering in Reports.
- [ ] **Tag Management:** Build UI for creating and managing transaction tags.

## 🔮 Future Ideas / Someday

- [ ] **Research Vector Memory (Pinecone):** Investigate using vector embeddings for long-term AI memory, enabling semantic search over transaction history and smarter "few-shot" categorization based on past user behavior.

