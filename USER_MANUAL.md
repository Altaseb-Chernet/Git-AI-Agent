## Git AI Agent — User Manual

### Overview
This project provides a **smart Git workspace**:
- **Frontend (Web)**: a workspace UI with Repo/Status, Chat, and a Commit Graph.
- **Backend (API)**: executes safe Git actions in the selected repository.

### Run the app
- **Backend**:

```bash
python backend/main.py
```

- **Frontend**:

```bash
cd frontend
npm run dev
```

### Select a repository (local)
- In the UI: **Workspace → Repository & Status → Browse Location**
- The active repo path is shown under “Open project”.

### Supported commands (chat)
#### Status & inspection
- `status`
- `list branches`
- `fetch`
- `pull` (uses `git pull --rebase`, blocks if you have uncommitted changes)

#### Branching
- `create branch <name>`
- `switch to <name>`

#### Upload (stage → commit → push)
- `upload my code`

Notes:
- If there are no staged changes, the agent will stop and tell you “nothing was committed or pushed”.
- If commit succeeds, the agent logs the commit hash.

#### Merge / Rebase / Cherry-pick
- `merge <branch>` (blocks if working tree isn’t clean)
- `rebase onto <branch>` (blocks if working tree isn’t clean)
- `abort rebase`
- `cherry-pick <hash>` (blocks if working tree isn’t clean)
- `abort cherry-pick`

### Conflicts (important)
This agent does **not** auto-resolve conflicts by default (it can lose code).
When you see a conflict:
1. Open conflicted files in your editor and resolve markers.
2. `git add .`
3. Continue:
   - Rebase: `git rebase --continue`
   - Cherry-pick: `git cherry-pick --continue`
   - Merge: `git commit` (or complete merge as Git instructs)

### Pull Requests
PR creation/merge are typically handled via GitHub UI or GitHub CLI (`gh`).
Recommended flow:
1. `create branch feature/my-change`
2. Make changes
3. `upload my code`
4. Create PR using GitHub UI or:

```bash
gh pr create
```

