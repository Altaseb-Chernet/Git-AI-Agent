from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pathlib import Path
import os

# Support both package + cwd execution styles
try:
    from backend.core.git_engine import GitEngine  # type: ignore
    from backend.core.ai_parser import AIParser  # type: ignore
    from backend.core.state_manager import global_state_manager  # type: ignore
except Exception:
    from core.git_engine import GitEngine  # type: ignore
    from core.ai_parser import AIParser  # type: ignore
    from core.state_manager import global_state_manager  # type: ignore

router = APIRouter()
git_engine = GitEngine(repo_path=os.getenv("GIT_AI_REPO_PATH", "."))
ai_parser = AIParser()

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
        status_data = git_engine.status()
        files = status_data.get("changed_files", [])
        if not files:
            response_msg = "Your working tree is clean. Nothing to commit."
        else:
            response_msg = f"You have {len(files)} modified files:\\n"
            for f in files:
                response_msg += f"- {f['state']} {f['path']}\\n"
            actions.append("Checked git status")

    elif action == "sync_push":
        # Check if remote exists
        success, out, err = git_engine.execute(["git", "remote", "-v"])
        if not success or "origin" not in out:
            global_state_manager.set_state("awaiting_remote_url")
            response_msg = "It looks like you do not have a remote repository configured. What is the URL (e.g., https://github.com/user/repo.git)?"
            require_input = True
            actions.append("Pre-flight check: Remote missing")
        else:
            # Sync flow: add -> commit -> push
            git_engine.add_all()
            actions.append("git add .")

            commit_msg = ai_parser.generate_commit_message("") # In future, pass git diff
            git_engine.commit(commit_msg)
            actions.append(f'git commit -m \\"{commit_msg}\\"')

            push_success, p_out, p_err = git_engine.push()
            if push_success:
                actions.append("git push")
                response_msg = "Successfully synced your code to the remote repository!"
            else:
                actions.append(f"Push failed: {p_err}")
                response_msg = f"Failed to push your code: {p_err}"

    elif action == "checkout":
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
            "changed_files": status_info.get("changed_files", []),
            "remote_url": remote_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RepoRequest(BaseModel): # Renamed from SetRepoRequest to RepoRequest as per snippet
    path: str

@router.post("/set_repo")
async def set_repo(request: RepoRequest): # Changed request type to RepoRequest
    """
    Endpoint to change the active git repository path.
    """
    path = Path(request.path)
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=400, detail="Directory does not exist")
    
    git_engine.repo_path = str(path.absolute()) # Changed to use instance git_engine
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
