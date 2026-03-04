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
            
        # Upload specific flows (Guided Process)
        if self.state == "upload_confirm_init":
            if user_input_lower == "y" or user_input_lower == "yes":
                init_repo()
                add_all()
                commit("Initial commit via AI Upload")
                self.state = "upload_get_remote"
                return "Repository initialized and commits created! Please paste your remote GitHub URL to continue."
            else:
                self.state = "idle"
                return "Upload cancelled."
                
        if self.state == "upload_confirm_push":
            if user_input_lower == "y" or user_input_lower == "yes":
                add_all()
                commit("Updates via AI Upload")
                res = push()
                self.state = "idle"
                return f"Push complete! 🚀\n{res}"
            else:
                self.state = "idle"
                return "Upload cancelled."
                
        if self.state == "upload_get_remote":
            url = user_input.strip()
            if not url.startswith("http") and not url.startswith("git@"):
                return "That doesn't look like a valid Git URL. Please provide the URL for your remote repository."
            # Add remote and push
            add_remote(url)
            res = push_origin_main()
            self.state = "idle"
            return f"Remote added successfully and code pushed! 🚀\n{res}"

        # Common Pre-check: Are we even in a git repo?
        status_check = get_status()
        is_git_repo = "fatal: not a git repository" not in status_check.lower()
        
        if not is_git_repo:
            if "init" in user_input_lower:
                return init_repo()
            elif "upload" in user_input_lower:
                self.state = "upload_confirm_init"
                return "I see this isn't a Git repository yet. I will step-by-step: initialize it, add all files, commit them, and prompt for a remote URL. Proceed? (y/n)"
            else:
                return "This folder is currently not a Git repository. Would you like to initialize one? Just type 'init'."
                
        # Normal command processing
        if "upload" in user_input_lower:
            remotes = get_remotes()
            if not remotes.strip():
                # No remote
                add_all()
                commit("Auto commit for upload")
                self.state = "upload_get_remote"
                return "I've detected changes but no remote repository. I've staged and committed them. Please paste your GitHub URL now, and I'll push them for you."
            else:
                # Has remote
                self.state = "upload_confirm_push"
                return "I will stage all files, create a commit, and push to your connected remote. Proceed? (y/n)"
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