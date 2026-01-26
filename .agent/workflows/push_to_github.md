---
description: Push changes to GitHub
---

1. Check the current git status.
   - `git status --short`

2. Identify which branch you are on.
   - `git branch --show-current`
   - **IMPORTANT:** Stay on the current branch. Do NOT switch to main unless explicitly asked.

3. If there are any deleted files (lines starting with `D`), restore them:
   - `git restore <deleted_file_path>`
   - Repeat for each deleted file to ensure no unintended deletions.

4. Add ONLY the files you explicitly changed. Do NOT use `git add .`
   - List the specific files: `git add <file1> <file2> ...`

5. Verify staged changes look correct:
   - `git status --short`
   - All staged files should show `M` (modified) or `A` (added), not `D` (deleted).

6. Commit the changes.
   - You MUST come up with a concise and relevant commit message.
   - `git commit -m "<commit_message>"`

// turbo
7. Push to the current branch.
   - `git push origin <current_branch_name>`