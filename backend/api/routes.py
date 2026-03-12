from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from core.git_engine import GitEngine
from core.ai_parser import AIParser
from core.state_manager import global_state_manager

router = APIRouter()
git_engine = GitEngine()
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
    \"\"\"
    Endpoint to receive natural language commands, parse intent,
    and execute Git actions, managing state seamlessly.
    \"\"\"
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
            actions.append(f"git commit -m \\"{commit_msg}\\"")

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
    \"\"\"
    Endpoint to get the current repository status.
    \"\"\"
    try:
        is_repo = git_engine.is_repo()
        if not is_repo:
            return {"is_repo": False}
            
        branch = git_engine.get_current_branch()
        status_info = git_engine.status()
        
        # Check remote
        su, out, err = git_engine.execute(["git", "remote", "get-url", "origin"])
        remote_url = out.strip() if su else None
        
        return {
            "is_repo": True,
            "branch": branch,
            "changed_files": status_info.get("changed_files", []),
            "remote_url": remote_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
