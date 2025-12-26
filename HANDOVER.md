# Principal Finance - Agent Handover Note

**Date:** December 27, 2025
**Session Summary:** Bug fixes for onboarding, routing, and UI improvements

---

## What Was Accomplished This Session

### ✅ Completed Fixes (Dec 26-27, 2025)

1. **Rule Preview in Settings → Rules Page**
   - Added Preview button to inline rule creation form
   - Shows match count and sample transactions
   - File: `frontend/src/components/RulesSection.jsx`

2. **Rule Preview in Create Rule Modal (from Transactions)**
   - Fixed 422 error - backend schema used `float = None` instead of `float | None = None`
   - Replaced unreliable useQuery pattern with async/await state-based approach
   - Files: 
     - `backend/routers/rules.py` (schema fix)
     - `frontend/src/components/CreateRuleModal.jsx` (frontend fix)

3. **FAB Blocking Table Row Clicks**
   - QuickAddFAB container was blocking clicks on bottom table rows
   - Added `pointer-events-none` to container, `pointer-events-auto` to buttons only
   - File: `frontend/src/components/QuickAddFAB.jsx`

4. **Onboarding Wizard Simplified**
   - Removed currency selection step (now defaults to AUD for Australian users)
   - Progress bar updated from 4 steps to 3 steps
   - File: `frontend/src/components/OnboardingWizard.jsx`

5. **Default Currency Changed to AUD**
   - Backend model default changed from `$` to `A$`
   - File: `backend/models.py`

6. **Data Management Route Fixed**
   - `/data-management` was incorrectly routing to Settings
   - Now correctly routes to DataManagement component
   - File: `frontend/src/App.jsx`

7. **Documentation Updated**
   - `feature_documentation.md` - Added Rule Preview feature description
   - `Feature Roadmap.md` - Rule Preview marked complete, Phases 10-11 added

---

## Current State

- **All changes pushed to GitHub** (main branch)
- **Frontend:** Vite dev server on port 5173
- **Backend:** uvicorn with `--reload` on port 8000
- **Database:** SQLite at `principal_v5.db`

---

## Known Issues to Fix (from user's Notes)

- Stocks don't add to net asset allocation graph
- Import stocks from CSV
- Stock cost base tracking
- Adding family member - typing slow
- AI insights - can't ask for non-standard timeframes
- Can't see any transactions in the calendar
- Splitting transactions - can't enter negatives, UI needs polish
- Insights error

---

## Next Steps / Roadmap

### Phase 9: Smart Rules Enhancement (Partially Complete)
- [x] Rule Preview
- [ ] Rule Testing - Dry-run rules against historical data
- [ ] Rule Suggestions - AI-suggested rules based on patterns

### Phase 10: Mobile App
- [ ] Capacitor Integration
- [ ] Push Notifications
- [ ] Biometric Auth
- [ ] App Store Deployment

### Phase 11: Family Sharing
- [ ] Invite Family Member
- [ ] Separate Logins
- [ ] Shared Data
- [ ] Per-Member Spending Tracking
- [ ] Role Permissions

---

## Key Files Reference

| Component | File Path |
|-----------|-----------|
| Rule Preview (Settings) | `frontend/src/components/RulesSection.jsx` |
| Rule Preview (Modal) | `frontend/src/components/CreateRuleModal.jsx` |
| Preview API Endpoint | `backend/routers/rules.py` |
| QuickAddFAB | `frontend/src/components/QuickAddFAB.jsx` |
| Onboarding Wizard | `frontend/src/components/OnboardingWizard.jsx` |
| App Routes | `frontend/src/App.jsx` |
| Feature Roadmap | `Feature Roadmap.md` |
| Feature Documentation | `feature_documentation.md` |
