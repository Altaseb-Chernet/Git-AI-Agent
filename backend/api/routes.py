from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pathlib import Path

from core.git_engine import GitEngine
from core.ai_parser import AIParser
from core.state_manager import global_state_manager

router = APIRouter()
git_engine = GitEngine()
ai_parser = AIParser()

def _ensure_repo_or_respond(actions: list[str]):
    if not git_engine.is_repo():
        actions.append("Not a git repository")
        return ChatResponse(
            response="This folder is not a Git repository. Use the Repository panel to select a repo.",
            actions_taken=actions,
            require_user_input=False,
            context=global_state_manager.context
        )
    return None

def _working_tree_clean() -> bool:
    try:
        cats = git_engine.status()
        return all(len(v) == 0 for v in cats.values())
    except Exception:
        return False

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    actions_taken: list[str] = []
    require_user_input: bool = False
    context: Dict[str, Any] = {}

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint to receive natural language commands, parse intent,
    and execute Git actions, managing state seamlessly.
    """
    actions = []
    require_input = False
    response_msg = ""
    current_state = global_state_manager.get_state()

    # Step 1: Stateful Handling
    if current_state == "awaiting_remote_url":
        url = request.message.strip()
        if not url.startswith("http") and not url.startswith("git@"):
             response_msg = "That doesn't look like a valid repository URL. Please provide a valid remote URL."
             require_input = True
        else:
             success, out, err = git_engine.execute(["git", "remote", "add", "origin", url])
             if success:
                 actions.append("Added remote 'origin'")
                 response_msg = f"Connected to {url}. Ready to push."
                 global_state_manager.set_state('idle')
             else:
                 actions.append(f"Failed to add remote: {err}")
                 response_msg = "There was an error connecting to that repository."

        return ChatResponse(
            response=response_msg,
            actions_taken=actions,
            require_user_input=require_input,
            context=global_state_manager.context
        )

    # Step 2: Intent Parsing
    parsed = ai_parser.parse_intent(request.message)
    action = parsed.get("action")
    args = parsed.get("args", {})

    # Step 3: Execution Logic based on Intent
    if action == "status":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        status_data = git_engine.status()
        # Consolidate all changes into a single list for the chat response
        all_changes = []
        for cat, files in status_data.items():
            for f in files:
                all_changes.append({"state": cat, "path": f})
        
        if not all_changes:
            response_msg = "Your working tree is clean. Nothing to commit."
        else:
            response_msg = f"You have {len(all_changes)} modified files:\n"
            for f in all_changes:
                response_msg += f"- {f['state']} {f['path']}\n"
            actions.append("Checked git status")

    elif action == "sync_push":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        # Check if remote exists
        success, out, err = git_engine.execute(["git", "remote", "-v"])
        if not success or "origin" not in out:
            global_state_manager.set_state("awaiting_remote_url")
            response_msg = "It looks like you do not have a remote repository configured. What is the URL (e.g., https://github.com/user/repo.git)?"
            require_input = True
            actions.append("Pre-flight check: Remote missing")
        else:
            # Sync flow: add -> commit -> push
            add_ok, add_out, add_err = git_engine.add_all()
            if add_ok:
                actions.append("git add .")
            else:
                actions.append(f"git add . (failed): {add_err}")
                response_msg = f"Failed to stage files: {add_err}"
                return ChatResponse(
                    response=response_msg,
                    actions_taken=actions,
                    require_user_input=require_input,
                    context=global_state_manager.context
                )

            # Capture staged changes for AI commit message generation
            diff_content = git_engine.diff(staged=True)
            if not diff_content.strip():
                # Nothing staged => nothing to commit; don't claim success
                actions.append("Nothing staged; commit skipped")
                response_msg = "No changes were staged, so nothing was committed or pushed. Make sure you edited files inside the selected repo."
                return ChatResponse(
                    response=response_msg,
                    actions_taken=actions,
                    require_user_input=require_input,
                    context=global_state_manager.context
                )
            commit_msg = ai_parser.generate_commit_message(diff_content)
            
            commit_ok, c_out, c_err = git_engine.commit(commit_msg)
            if commit_ok:
                actions.append(f'git commit -m "{commit_msg}"')
                # Record the exact commit created
                h_ok, h_out, h_err = git_engine.execute(["git", "rev-parse", "--short", "HEAD"])
                if h_ok and h_out:
                    actions.append(f"Committed {h_out}")
            else:
                # Common case: nothing to commit (exit code 1)
                actions.append(f'git commit -m "{commit_msg}" (failed): {c_err}')
                response_msg = f"Commit failed: {c_err}"
                return ChatResponse(
                    response=response_msg,
                    actions_taken=actions,
                    require_user_input=require_input,
                    context=global_state_manager.context
                )

            push_success, p_out, p_err = git_engine.push()
            if push_success:
                actions.append("git push")
                # p_out often includes 'Everything up-to-date' even when nothing new was pushed.
                if p_out and "Everything up-to-date" in p_out:
                    response_msg = "Push completed, but the remote was already up-to-date."
                else:
                    response_msg = "Successfully synced your code to the remote repository!"
            else:
                actions.append(f"Push failed: {p_err}")
                response_msg = f"Failed to push your code: {p_err}"

    elif action == "checkout":
         maybe = _ensure_repo_or_respond(actions)
         if maybe:
             return maybe
         branch = args.get("branch_name")
         if not branch:
             response_msg = "Which branch would you like to checkout?"
         else:
             su, out, err = git_engine.execute(["git", "checkout", branch])
             if su:
                 actions.append(f"git checkout {branch}")
                 response_msg = f"Switched to branch {branch}."
             else:
                 actions.append(f"Checkout failed: {err}")
                 response_msg = f"Could not switch to that branch: {err}"

    elif action == "new_branch":
         maybe = _ensure_repo_or_respond(actions)
         if maybe:
             return maybe
         branch = args.get("branch_name")
         if not branch:
             response_msg = "What do you want to name the new branch?"
         else:
             su, out, err = git_engine.execute(["git", "checkout", "-b", branch])
             if su:
                 actions.append(f"git checkout -b {branch}")
                 response_msg = f"Created and switched to a new branch called {branch}."
             else:
                 actions.append(f"Branch creation failed: {err}")
                 response_msg = f"Failed to create the branch: {err}"
    elif action == "branch_list":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        ok, out, err = git_engine.list_branches()
        if ok:
            actions.append("git branch --all --verbose")
            response_msg = out or "No branches found."
        else:
            actions.append(f"Branch list failed: {err}")
            response_msg = f"Failed to list branches: {err}"

    elif action == "fetch":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        ok, out, err = git_engine.fetch()
        if ok:
            actions.append("git fetch --prune origin")
            response_msg = out or "Fetched latest refs from origin."
        else:
            actions.append(f"Fetch failed: {err}")
            response_msg = f"Failed to fetch: {err}"

    elif action == "pull":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        if not _working_tree_clean():
            actions.append("Pull blocked: working tree not clean")
            response_msg = "Pull blocked because your working tree has changes. Commit/stash first, then retry."
        else:
            ok, out, err = git_engine.pull(rebase=True)
            if ok:
                actions.append("git pull --rebase origin <current-branch>")
                response_msg = out or "Pulled latest changes (rebase)."
            else:
                actions.append(f"Pull failed: {err}")
                response_msg = f"Failed to pull: {err}"

    elif action == "merge":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        branch = args.get("branch_name")
        if not branch:
            response_msg = "Which branch do you want to merge into the current branch?"
        elif not _working_tree_clean():
            actions.append("Merge blocked: working tree not clean")
            response_msg = "Merge blocked because your working tree has changes. Commit/stash first, then retry."
        else:
            ok, out, err = git_engine.merge(branch)
            if ok:
                actions.append(f"git merge --no-ff {branch}")
                response_msg = out or f"Merged {branch}."
            else:
                actions.append(f"Merge failed: {err}")
                if "CONFLICT" in (out + "\n" + err):
                    response_msg = "Merge has conflicts. Resolve files, then run `git add .` and `git commit`."
                else:
                    response_msg = f"Failed to merge: {err}"

    elif action == "rebase":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        onto = args.get("onto")
        if not onto:
            response_msg = "Rebase onto which branch? Example: `rebase onto main`."
        elif not _working_tree_clean():
            actions.append("Rebase blocked: working tree not clean")
            response_msg = "Rebase blocked because your working tree has changes. Commit/stash first, then retry."
        else:
            ok, out, err = git_engine.rebase(onto)
            if ok:
                actions.append(f"git rebase {onto}")
                response_msg = out or f"Rebased onto {onto}."
            else:
                actions.append(f"Rebase failed: {err}")
                if "CONFLICT" in (out + "\n" + err):
                    response_msg = "Rebase has conflicts. Resolve files, then run `git add .` and `git rebase --continue`."
                else:
                    response_msg = f"Failed to rebase: {err}"

    elif action == "rebase_abort":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        ok, out, err = git_engine.rebase_abort()
        if ok:
            actions.append("git rebase --abort")
            response_msg = out or "Rebase aborted."
        else:
            actions.append(f"Abort failed: {err}")
            response_msg = f"Failed to abort rebase: {err}"

    elif action == "cherry_pick":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        commit_hash = args.get("commit")
        if not commit_hash or commit_hash == "unknown":
            response_msg = "Which commit hash should I cherry-pick? Example: `cherry-pick a1b2c3d`."
        elif not _working_tree_clean():
            actions.append("Cherry-pick blocked: working tree not clean")
            response_msg = "Cherry-pick blocked because your working tree has changes. Commit/stash first, then retry."
        else:
            ok, out, err = git_engine.cherry_pick(commit_hash)
            if ok:
                actions.append(f"git cherry-pick {commit_hash}")
                response_msg = out or f"Cherry-picked {commit_hash}."
            else:
                actions.append(f"Cherry-pick failed: {err}")
                if "CONFLICT" in (out + "\n" + err):
                    response_msg = "Cherry-pick has conflicts. Resolve files, then run `git add .` and `git cherry-pick --continue`."
                else:
                    response_msg = f"Failed to cherry-pick: {err}"

    elif action == "cherry_pick_abort":
        maybe = _ensure_repo_or_respond(actions)
        if maybe:
            return maybe
        ok, out, err = git_engine.cherry_pick_abort()
        if ok:
            actions.append("git cherry-pick --abort")
            response_msg = out or "Cherry-pick aborted."
        else:
            actions.append(f"Abort failed: {err}")
            response_msg = f"Failed to abort cherry-pick: {err}"

    else:
        response_msg = "I'm not sure what you mean. Try saying 'upload my code' or 'check status'."
        actions.append("Unknown intent")

    return ChatResponse(
        response=response_msg,
        actions_taken=actions,
        require_user_input=require_input,
        context=global_state_manager.context
    )

@router.get("/status")
async def repo_status():
    """
    Endpoint to get the current repository status.
    """
    try:
        is_repo = git_engine.is_repo()
        if not is_repo:
            return {"is_repo": False, "repo_path": git_engine.repo_path}
            
        branch = git_engine.get_current_branch()
        status_info = git_engine.status()
        
        # Check remote
        su, out, err = git_engine.execute(["git", "remote", "get-url", "origin"])
        remote_url = out.strip() if su else None

        return {
            "is_repo": True,
            "repo_path": git_engine.repo_path,
            "branch": branch,
            "categories": status_info,
            "remote_url": remote_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RepoRequest(BaseModel): # Renamed from SetRepoRequest to RepoRequest as per snippet
    path: str

@router.post("/set_repo")
async def set_repo(request: RepoRequest):
    """
    Endpoint to change the active git repository path.
    """
    path = Path(request.path)
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=400, detail="Directory does not exist")
    
    git_engine.repo_path = str(path.absolute())
    # Clear any multi-step chat flow when switching repos so commands
    # can't continue against the previous repo's conversational state.
    global_state_manager.clear_context()
    return {"status": "success", "repo_path": git_engine.repo_path}

@router.get("/select_directory")
async def select_directory():
    try:
        import tkinter as tk
        from tkinter import filedialog
        
        # We need to run tkinter cautiously in a thread-safe / non-blocking way for the web server,
        # but since we are local, an ephemeral hidden root window is fine.
        root = tk.Tk()
        root.withdraw() # Hide the main window
        root.attributes('-topmost', True) # Bring dialog to front
        
        folder_path = filedialog.askdirectory(parent=root, title="Select Git Project Folder")
        root.destroy()
        
        if folder_path:
            return {"path": folder_path}
        return {"path": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open native dialog: {str(e)}")

@router.get("/graph") # Reverted to original endpoint path /graph
async def repo_graph():
    """
    Endpoint to get commit history topology for visualization.
    Retrieves commit hash, parent hashes, refs (branches/tags), author, and message.
    """
    try:
        if not git_engine.is_repo():
            return {"commits": []}
            
        # Format: hash|parent_hashes|refs|author_name|subject
        # %h = abbreviated commit hash
        # %p = abbreviated parent hashes
        # %d = ref names (branches, tags)
        # %an = author name
        # %s = subject (commit message)
        success, out, err = git_engine.execute([
            "git", "log", "--all", "--topo-order", "--format=%h|%p|%d|%an|%s"
        ])
        
        if not success:
            return {"commits": [], "error": err}
            
        commits = []
        for line in out.strip().split('\n'):
            if not line:
                continue
            parts = line.split('|', 4)
            if len(parts) == 5:
                commit_hash, parents, refs, author, msg = parts
                
                # Cleanup refs format: " (HEAD -> main, origin/main)" -> ["HEAD -> main", "origin/main"]
                clean_refs = []
                if refs.strip():
                    ref_str = refs.strip()[1:-1] # Remove surrounding ()
                    clean_refs = [r.strip() for r in ref_str.split(', ')]
                    
                commits.append({
                    "id": commit_hash.strip(),
                    "parents": [p for p in parents.strip().split(' ') if p],
                    "refs": clean_refs,
                    "author": author.strip(),
                    "message": msg.strip()
                })
                
        return {"commits": commits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
