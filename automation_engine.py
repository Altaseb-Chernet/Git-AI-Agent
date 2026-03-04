from git_tools import *

class AutomationEngine:
    def __init__(self):
        self.state = "idle"

    def process(self, user_input):
        user_input_lower = user_input.lower().strip()
        
        # Check if we are in a special state
        if self.state == "awaiting_remote_url":
            # Assume the user provided the URL
            url = user_input.strip()
            if not url.startswith("http") and not url.startswith("git@"):
                return "That doesn't look like a valid Git URL. Please provide the URL for your remote repository."
            
            # Add remote and push
            add_remote(url)
            self.state = "idle"
            res = push_origin_main()
            return f"Remote added successfully.\n{res}"
            
        # Common Pre-check: Are we even in a git repo?
        status_check = get_status()
        is_git_repo = "fatal: not a git repository" not in status_check.lower()
        
        if not is_git_repo:
            if "init" in user_input_lower:
                return init_repo()
            else:
                return "This folder is currently not a Git repository. Would you like to initialize one? Just type 'init'."
                
        # Normal command processing
        if "status" in user_input_lower:
            return status_check

        if "commit" in user_input_lower:
            add_all()
            return commit("Auto commit by AI Agent")

        if "push" in user_input_lower:
            # Check if there's a remote
            remotes = get_remotes()
            if not remotes.strip():
                # No remote found, enter state machine
                self.state = "awaiting_remote_url"
                
                # We should also commit any pending changes first as a courtesy
                add_all()
                commit("Auto commit before push")
                
                return "There is no remote repository configured for this project. Please paste your remote Git URL here to connect it."
            else:
                return push()

        if "create branch" in user_input_lower:
            words = user_input_lower.split()
            if len(words) >= 3:
                name = words[-1]
                return create_branch(name)
            return "Please provide a branch name, e.g., 'create branch dev'."

        return "Command not recognized. Try 'status', 'commit', 'push', 'create branch [name]', or 'init'."