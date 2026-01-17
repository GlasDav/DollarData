---
description: Wrap up a development session by updating documentation and committing changes
---

# Session Wrap-Up Workflow

Follow these steps at the end of each development session to ensure all changes are documented and committed.

## 1. Update CONTEXT_MAP.md

Add entries to the **Recent Changes & Fixes** section:

```bash
view_file "CONTEXT_MAP.md"
```

For each change made during the session, add a bullet point with:
- Feature name (bold)
- Brief description of what was added/changed
- Key files affected (if relevant)

Example format:
```markdown
- **Feature Name:**
  - What was added or changed.
  - Key file: `path/to/file.jsx`
```

Also update **Known Issues** section:
- Mark fixed issues as resolved (remove them or move to Recent Changes)
- Add any new issues discovered during the session

---

## 2. Update ROADMAP.md

```bash
view_file "ROADMAP.md"
```

- Mark completed items with `[x]`
- Add new tasks discovered during the session with `[ ]`
- Add sub-tasks for partially completed features

---

## 3. Update BRAND GUIDELINES.md (if UI changes)

```bash
view_file "frontend/BRAND GUIDELINES.md"
```

Only if styling/design changes were made:
- Update color tokens
- Add new component examples
- Update migration guide mappings

---

## 4. Update Onboarding Tutorial (if user-facing changes)

```bash
view_file "docs/ONBOARDING_TUTORIAL.md"
```

If any user-facing features were added, modified, or removed:
- Add new features to the relevant module
- Update instructions if workflows changed
- Add new modules for major features
- Update component references in HTML comments

**Modules to update based on change type:**

| Change Area | Tutorial Module |
|-------------|-----------------|
| Account/Household settings | Module 1: Getting Started |
| Budget categories | Module 2: Categories |
| Smart rules/automation | Module 3: Smart Rules |
| Import/Data management | Module 4: Import Transactions |
| Net worth/investments | Module 5: Net Worth & Accounts |
| Dashboard/widgets | Module 6: Dashboard |
| Budget progress/limits | Module 7: Budgeting |
| Goals/Achievements | Module 8: Goals & Achievements |
| Reports/Analytics/AI | Module 9: Reports & Analytics |

---

## 5. Review and Commit Changes

// turbo
```bash
git status
```

Review changed files, then stage and commit:

```bash
git add -A
git commit -m "feat: <brief description of session work>"
```

Use conventional commit prefixes:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation only
- `refactor:` for refactoring
- `style:` for styling/UI changes

---

## 6. Push to GitHub (Optional)

If ready to push changes:

```bash
/push_to_github
```

---

## Documentation Quick Reference

| File | When to Update |
|------|----------------|
| `CONTEXT_MAP.md` | Always - document all changes |
| `ROADMAP.md` | When completing or adding tasks |
| `docs/ONBOARDING_TUTORIAL.md` | User-facing feature changes |
| `frontend/BRAND GUIDELINES.md` | UI/styling changes only |
| `backend/auto_migrate.py` | Database schema changes |
| `.agent/workflows/*.md` | New reusable processes |

