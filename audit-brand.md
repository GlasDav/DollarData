---
description: Verify that all UI components adhere to the brand guidelines (colors, fonts, tokens).
---

# Brand Audit Workflow

This workflow checks for hardcoded colors and ensures design tokens are used.

## 1. Search for Hardcoded Colors
Scanning for hex codes that should be replaced with tokens:

```bash
grep -r "#[0-9A-Fa-f]{6}" frontend/src/components
```

## 2. Verify Font Usage
Ensure no system fonts or hardcoded families are used, only `font-sans` classes.

## 3. Check Design Token Usage
Files should use `bg-card`, `text-primary`, `border-border`, etc.

## 4. Specific Component Checks
- [ ] Landing Page
- [ ] Achievements Widget
- [ ] Safe To Spend Widget

## 5. Report Findings
List any violations found for remediation.
