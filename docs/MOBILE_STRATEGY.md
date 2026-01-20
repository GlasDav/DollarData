# DollarData Mobile Strategy

This document outlines the strategic roadmap for building native iOS and Android apps for DollarData.

## 📱 Executive Summary

We will build **Native Mobile Apps** using **React Native (via Expo Framework)**.

**Why this approach?**
1.  **Non-Destructive & Parallel**: We can build the mobile app in a completely separate `mobile` folder. The existing web app (`frontend`) continues to run exactly as is. There is **zero risk** to the current production site.
2.  **Truly "Mobile Friendly"**: The user specifically noted that the current app "is not mobile friendly". Wrapping the web app (Capacitor/Ionic) often results in a sub-par "web-view" feel that doesn't solve core UX issues. React Native offers true native navigation, gestures, and performance.
3.  **Code Sharing**: We can reuse ~60-70% of the code (Business Logic, API Clients, State Management, Types, Constants) while rewriting the UI for mobile-specific UX.
4.  **Modern Stack**: Fits perfectly with our existing React/TS/Tailwind stack.
5.  **Device Features**: Easier access to Biometrics (FaceID/TouchID) for fast login, and Notifications.

---

## 🛡️ The Parallel Execution Strategy

You asked: *"Can we do this in parallel... keeping the existing web app running as is?"*
**Answer: YES. This is the safest way to proceed.**

**The "Side-by-Side" Workflow:**

1.  **Zero-Touch on Web**: We will NOT touch the `frontend` folder initially. The current web app remains the "Source of Truth" and stays in production.
2.  **Duplicate then Deduplicate**: To avoid breaking the web app, we will initially **copy** necessary logic (like `api.js` or `chartColors.js`) into the `mobile` project.
    *   *Benefit*: We don't risk introducing bugs into the live web app by refactoring it too early.
3.  **Standalone Mobile App**: The `mobile` folder will be a standalone React Native application that just happens to hit the same Backend API (`http://localhost:8000` or `https://dollardata.au/api`).
4.  **Convergence (Later)**: Only when the mobile app is feature-complete and tested do we look at "Shared Packages" to clean up duplicate code.

**Project Structure during Phase 1-3:**

```text
/dollardata
  /backend           (Runs on port 8000 - Serves BOTH apps)
  /frontend          (Runs on port 5173 - LIVE Web App - UNTOUCHED)
  /mobile            (Runs on Expo Go - NEW Mobile App - DEVELOPMENT)
```

---

## 🏗️ Architecture: The Monorepo Strategy (Long Term)

Eventually, to keep things clean (Phase 4+):

```text
/dollardata
  /backend           (FastAPI - Existing)
  /frontend          (React Web - Existing)
  /mobile            (React Native - NEW)
  /packages          (Shared Code - NEW)
    /core            (API, Hooks, Types, Contexts)
    /ui              (Shared low-level constants, themes)
```

**Phase 1 (Pragmatic/Fast)**: We can start by keeping `frontend` as is, and just importing logic *from* it or duplicating small bits, but a properly extracted `core` package is cleaner long-term.

---

## 🛠️ Tech Stack & Translation

We need to translate our Web Stack to the Native Stack.

| Layer | Web (Current) | Mobile (Proposed) | Effort to Port |
|-------|---------------|-------------------|----------------|
| **Framework** | React 19 + Vite | React Native (Expo SDK 52) | Medium |
| **Language** | TypeScript / JSX | TypeScript / JSX | None (Shared) |
| **Styling** | Tailwind CSS v4 | **NativeWind v4** | Very Low (Same syntax) |
| **Navigation** | React Router DOM | **Expo Router** (File-based, similar mental model) | Medium |
| **State** | TanStack Query | TanStack Query | None (Shared) |
| **Charts** | Recharts | **Victory Native** or **Gifted Charts** | High (Rewrite) |
| **Auth** | Supabase Auth (Local Storage) | Supabase Auth (**Expo Secure Store**) | Low |
| **Icons** | Lucide React | **Lucide React Native** | Low |
| **Drag & Drop**| @dnd-kit | **Reanimated** + **Gesture Handler** | High |

---

## 📅 Roadmap & Implementation Steps

### Phase 1: Setup & Backbone (Weeks 1-2)
*Goal: A "Hello World" app that can Login and show a user profile.*

1.  **Initialize Expo Project**: Create `/mobile` using `npx create-expo-app@latest`.
2.  **Configure NativeWind**: Set up Tailwind for standard styling.
3.  **Authentication**:
    *   Port `AuthContext` to use `expo-secure-store` for token storage.
    *   Implement Login Screen (FaceID integration later).
4.  **Navigation Shell**:
    *   Setup **Tabs** (Dashboard, Transactions, Add, Net Worth, Settings).
    *   Setup **Stack** for modals (Add Transaction, Login).

### Phase 2: Core Data Read (Weeks 3-4)
*Goal: Users can view their data (Dashboard & Transactions).*

1.  **Shared API Client**: Extract `services/api.js` logic so both apps can use it.
2.  **Dashboard**:
    *   Build "Native Widgets" (Safe-to-Spend, Recent Transactions).
    *   *Note*: Skip complex charts initially; show text summaries/simple bars.
3.  **Transaction List**:
    *   Use `FlashList` (Shopify) for high-performance scrolling.
    *   Implement "Pull to Refresh".

### Phase 3: The "Mobile First" Features (Weeks 5-6)
*Goal: Features that work BETTER on mobile.*

1.  **Quick Add Transaction**:
    *   A prominent "Plus" button in the center of the tab bar.
    *   Camera integration to snap photos of receipts (future OCR).
2.  **Push Notifications**:
    *   Configuring Expo Notifications for bill reminders (replacing email reliance).
3.  **Biometric Login**: Login with FaceID/TouchID.

### Phase 4: Charts & Visuals (Weeks 7-8)
*Goal: Premium visual parity.*

1.  **Chart Rewrite**: Port `CashFlowTrendWidget` and `NetWorthWidget` to `victory-native` or `react-native-wagmi-charts`.
2.  **Gestures**: Interactive scrubbable charts (touch and hold to see values).

---

## ⚠️ Key Challenges & Risks

1.  **Charts**: `Recharts` is DOM-based and 100% incompatible with Native. We must rewrite every chart.
2.  **Complex Layouts**: The "Grid" layout on the dashboard needs to be converted to a ScrollView with Flexbox rows (VStack/HMSStack) for mobile.
3.  **Apple/Google Store Review**: We need to ensure we don't violate In-App Purchase rules (if we add subscriptions later).

## ✅ Immediate Next Steps

1.  **Review this plan**: Confirm if you prefer **React Native (Native Experience)** or **Capacitor (Web Wrapper)**. *Recommendation remains React Native.*
2.  **Initialize Repo**: Create the `mobile` folder.
3.  **Proof of Concept**: Get the Login screen working on your simulator.
