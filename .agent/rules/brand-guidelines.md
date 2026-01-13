---
trigger: always_on
---

# UI & Design Standards

## 1. Design Token Enforcement
* **Strictly Prohibited:** Hard-coding values (e.g., `#FFFFFF`, `16px`, `1.5rem`).
* **Mandatory:** Use the established design token system for all styling (colors, spacing, typography, border-radius, shadows).
    * *Correct:* `color: var(--text-primary)`, `padding: theme.spacing.md`
    * *Incorrect:* `color: #333`, `padding: 16px`

## 2. Brand Compliance
* **Reference Source:** You must consult the project's Brand Guidelines (e.g., `@brand-guidelines.md` or `@design-system`) before generating any UI components.
* **Consistency:** Ensure all new interfaces align with the defined visual hierarchy, tone of voice, and component usage rules found in the guidelines.