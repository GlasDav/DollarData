# Principal Finance - Agent Handover Note

**Date:** December 27, 2025  
**Session Summary:** UI bug fixes, review functionality, and UX improvements

---

## What Was Accomplished This Session (Dec 27, 2025)

### ✅ UI & Functionality Fixes

1. **Calendar Not Showing Transactions**
   - Root cause: Date key calculation used timezone offset causing mismatches
   - Fix: Simplified to YYYY-MM-DD string formatting
   - File: `frontend/src/pages/FinancialCalendar.jsx`

2. **Calendar: Show Amount Instead of Count for Due Items**
   - Changed from "3 Due" to "$150 Due" for upcoming recurring transactions
   - File: `frontend/src/pages/FinancialCalendar.jsx`

3. **Split Transaction Modal - Allow Negative Numbers**
   - Root cause: `parseFloat() || 0` blocked typing "-" or clearing input
   - Fix: Store amounts as strings, parse only for calculations
   - Changed input from `type="number"` to `type="text"` with `inputMode="decimal"`
   - File: `frontend/src/components/SplitTransactionModal.jsx`

4. **Slow Typing When Adding Family Member**
   - Root cause: API call triggered on every keystroke
   - Fix: Use local state, save only on blur/Enter
   - File: `frontend/src/components/settings/MembersSettings.jsx`

5. **Review Button Now Visible for All Household Setups**
   - Changed condition from `is_couple_mode` to `members.length > 0`
   - Dropdown now uses dynamic household members list with colors
   - File: `frontend/src/pages/Transactions.jsx`

6. **Clearing Review Assignment Now Works**
   - Root cause: Pydantic validator converted empty string to None before backend
   - Fix: Preserve empty string in schema validator for `assigned_to`
   - Files: `backend/schemas.py`, `frontend/src/pages/Transactions.jsx`

7. **Transactions Table Width (Removed Goal Column)**
   - Reduced table from 8 to 7 columns to fix cut-off columns
   - File: `frontend/src/pages/Transactions.jsx`

### ✅ UX Improvements

8. **Sorted Category Dropdowns**
   - Created `sortBucketsByGroup()` utility
   - Sort order: Income → Non-Discretionary → Discretionary → Alphabetical
   - Applied to: Transactions, SplitTransactionModal, Review, DataManagement
   - New file: `frontend/src/utils/bucketUtils.js`

### ✅ Previous Fixes (Dec 26, 2025)
- Rule Preview in Settings → Rules Page
- Rule Preview in Create Rule Modal (fixed 422 error)
- FAB Blocking Table Row Clicks
- Onboarding Wizard Simplified (3 steps)
- Default Currency Changed to A$
- Data Management Route Fixed

---

## Current State

- **All changes pushed to GitHub** (main branch)
- **Frontend:** Vite dev server on port 5173
- **Backend:** uvicorn with `--reload` on port 8000
- **Database:** SQLite at `principal_v5.db`

---

## Running the Application

```bash
# Terminal 1 - Backend
cd backend
..\venv\Scripts\activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Known Issues Remaining (from user's Notes)

- [ ] Stocks don't add to net asset allocation graph
- [ ] Import stocks from CSV
- [ ] Stock cost base tracking
- [ ] AI insights - can't ask for non-standard timeframes
- [ ] Insights error

---

## Key Files Modified This Session

| Component | File Path |
|-----------|-----------|
| Financial Calendar | `frontend/src/pages/FinancialCalendar.jsx` |
| Split Transaction Modal | `frontend/src/components/SplitTransactionModal.jsx` |
| Member Settings | `frontend/src/components/settings/MembersSettings.jsx` |
| Transactions Page | `frontend/src/pages/Transactions.jsx` |
| Review Page | `frontend/src/pages/Review.jsx` |
| Data Management | `frontend/src/pages/DataManagement.jsx` |
| Bucket Utilities | `frontend/src/utils/bucketUtils.js` (NEW) |
| Transaction Schema | `backend/schemas.py` |
| Transactions Router | `backend/routers/transactions.py` |

---

## Architecture Notes

### Category Dropdown Sorting
All category dropdowns now use `sortBucketsByGroup()` from `utils/bucketUtils.js`:
- Groups ordered: Income (0), Non-Discretionary (1), Discretionary (2)
- Alphabetically sorted within each group

### Review Assignment Flow
- Frontend sends empty string `''` to clear assignment
- Pydantic schema preserves empty string (special validator)
- Backend converts empty string to `None` in database
- Visual styling checks `txn.assigned_to ?` (falsy = no highlight)
