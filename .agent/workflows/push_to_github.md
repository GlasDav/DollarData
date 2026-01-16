---
description: Push changes to GitHub
---

1. Check the current git status.
   - `git status`

2. Ensure you are on the main branch.
   - `git checkout main`
   - `git pull origin main`

3. Add all changes to the staging area.
   - `git add .`

4. Commit the changes.
   - You MUST come up with a concise and relevant commit message.
   - `git commit -m "<commit_message>"`

5. Push the changes to the remote repository.
// turbo
   - `git push origin main`