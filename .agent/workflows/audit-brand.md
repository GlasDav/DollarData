---
description: Audit the codebase for brand guideline violations
---

1. Scan for hardcoded tailwind colors (e.g. text-red-500, bg-slate-100)
   - `grep -rE "text-(red|blue|green|slate|gray|zinc|neutral|stone|orange|amber|yellow|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{3}" frontend/src/components frontend/src/pages`

2. Scan for hardcoded hex codes
   - `grep -rE "#[0-9a-fA-F]{3,6}" frontend/src/components frontend/src/pages`

3. Verify usage of design tokens
   - `grep -r "text-text-primary" frontend/src`
   - `grep -r "bg-card" frontend/src`

4. Report any files that contain violations.
