from git_tools import *
import re

def generate_commit_message():
    diff = get_untracked_diff() + "\n" + get_diff()
    if not diff.strip():
        return "Clean up code and formatting"
    
    # Heuristic AI generation
    added_files = re.findall(r"a/(.+) b/", diff)
    if not added_files:
        return "Auto commit: Updates to project"
        
    unique_files = list(set(added_files))
    if len(unique_files) == 1:
        return f"Update {unique_files[0]} logic and fixes"
    elif len(unique_files) <= 3:
        files_str = ", ".join(unique_files)
        return f"Modify {files_str} with targeted changes"
    else:
        return f"Refactor multiple files including {unique_files[0]} and {unique_files[1]}"

class AutomationEngine:
    def __init__(self):
        self.state = "idle"
        self.temp_msg = ""
        self.temp_branch = ""
        self.temp_name = ""

    def process(self, user_input):
        user_input_lower = user_input.lower().strip()
        
        # --- Advanced State Machine Flows ---
        if self.state == "sync_confirm":
            if user_input_lower in ["y", "yes"]:
                add_all()
                res_commit = commit(self.temp_msg)
                
                # Check for conflicts during pull
                pull_res = pull()
                if "CONFLICT" in pull_res or "Automatic merge failed" in pull_res:
                    self.state = "conflict_wait"
                    return "⚠️ Merge Conflict Detected! I've paused the flow. Please check your files and resolve the conflicts manually. Reply 'resolved' when you are done."
                
                res = push()
                self.state = "idle"
                return f"Sync complete! 🚀\n{res}"
            else:
                self.state = "idle"
                return "Sync cancelled."
                
        if self.state == "conflict_wait":
            if user_input_lower == "resolved":
                add_all()
                commit("Resolve merge conflicts")
                res = push()
                self.state = "idle"
                return f"Conflicts resolved and pushed! 🚀\n{res}"
            return "Still waiting for you to resolve conflicts. Type 'resolved' when done."

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
            if user_input_lower in ["y", "yes"]:
                init_repo()
                add_all()
                commit("Initial commit via AI Upload")
                self.state = "upload_get_remote"
                return "Repository initialized and commits created! Please paste your remote GitHub URL to continue."
            else:
                self.state = "idle"
                return "Upload cancelled."
                
        if self.state == "upload_confirm_push":
            if user_input_lower in ["y", "yes"]:
                add_all()
                commit(self.temp_msg)
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

        # --- Main routing ---
        # --- Natural Language Intent Parsing ---
        intent = "unknown"
        
        # 1. Upload/Sync Intent
        if any(word in user_input_lower for word in ["upload", "sync", "save", "push my code", "save my changes"]):
            intent = "upload"
            
        # 2. Status Intent
        elif any(word in user_input_lower for word in ["status", "what is happening", "what changed"]):
            intent = "status"
            
        # 3. Commit Intent
        elif any(word in user_input_lower for word in ["commit", "record changes"]):
            intent = "commit"
            
        # 4. Create Branch Intent
        elif any(phrase in user_input_lower for phrase in ["create branch", "new branch", "make a branch"]):
            intent = "create_branch"
            
        # 5. Switch Branch Intent
        elif any(phrase in user_input_lower for phrase in ["switch branch", "change branch", "change the branch", "checkout", "switch to"]):
            intent = "switch_branch"
            
        # 6. Merge Intent
        elif "merge" in user_input_lower:
            intent = "merge"
            
        # 7. Undo Intent
        elif any(phrase in user_input_lower for phrase in ["undo", "oops", "revert", "go back", "made a mistake"]):
            intent = "undo"

        # 8. User Config Intent
        elif any(word in user_input_lower for word in ["config", "user info", "who am i", "set my name", "git user"]):
            intent = "config"

        # 9. Help Intent
        elif user_input_lower in ["help", "/help", "what can you do", "commands"]:
            intent = "help"

        # 10. Clear Intent
        elif user_input_lower in ["clear", "cls"]:
            intent = "clear"
            
        # --- State Machine for Missing Info ---
        if self.state == "awaiting_switch_branch_name":
            name = user_input.strip()
            res = checkout(name)
            if "error:" in res and "did not match any file(s)" in res:
                 self.temp_branch = name
                 self.state = "confirm_create_missing_branch"
                 return f"The branch '{name}' does not exist yet. Would you like me to create it for you? (y/n)"
            self.state = "idle"
            return f"Switched to branch '{name}'."
            
        if self.state == "confirm_create_missing_branch":
            if user_input_lower in ["y", "yes"]:
                res = create_branch(self.temp_branch)
                self.state = "idle"
                return f"Created and switched to new branch '{self.temp_branch}'!"
            self.state = "idle"
            return "Branch creation cancelled."
            
        if self.state == "awaiting_create_branch_name":
            name = user_input.strip().replace(" ", "-") # Safely format branch names
            self.state = "idle"
            create_branch(name)
            return f"Created and switched to new branch '{name}'!"
            
        if self.state == "awaiting_merge_branch_name":
            branch = user_input.strip()
            pull_res = merge(branch)
            if "CONFLICT" in pull_res or "Automatic merge failed" in pull_res:
                 self.state = "conflict_wait"
                 return f"⚠️ Merge Conflict with {branch}! Please check your files, resolve, and reply 'resolved'."
            self.state = "idle"
            return f"Merged {branch}.\n{pull_res}"

        if self.state == "awaiting_config_name":
            self.temp_name = user_input.strip()
            self.state = "awaiting_config_email"
            return f"Got it, {self.temp_name}. Now, what is your email address?"

        if self.state == "awaiting_config_email":
            email = user_input.strip()
            self.state = "idle"
            git_config(self.temp_name, email)
            return f"Perfect! I've set your Git user to:\nName: {self.temp_name}\nEmail: {email}"

        # --- Main routing based on Intent ---
        # Common Pre-check: Are we even in a git repo?
        status_check = get_status()
        is_git_repo = "fatal: not a git repository" not in status_check.lower()
        
        if not is_git_repo:
            if "init" in user_input_lower or "yes" in user_input_lower:
                return init_repo()
            elif intent == "upload":
                self.state = "upload_confirm_init"
                return "I see this isn't a Git repository yet. I will step-by-step: initialize it, add all files, commit them, and prompt for a remote URL. Proceed? (y/n)"
            else:
                return "This folder is currently not a Git repository. Would you like to initialize one? Just type 'init' or 'yes'."

        if intent == "upload":
            remotes = get_remotes()
            if not remotes.strip():
                self.temp_msg = generate_commit_message()
                self.state = "upload_get_remote"
                return f"I generated this commit message for you:\n\n'{self.temp_msg}'\n\nNo remote found. Paste your remote GitHub URL to continue."
            else:
                self.temp_msg = generate_commit_message()
                self.state = "sync_confirm"
                return f"I generated this commit message for your changes:\n\n'{self.temp_msg}'\n\nI will now stage, commit, pull, and push. Proceed? (y/n)"

        if intent == "status":
            return status_check

        if intent == "commit":
            self.temp_msg = generate_commit_message()
            add_all()
            return commit(self.temp_msg)

        if intent == "create_branch":
            words = user_input_lower.split()
            stop_words = ["i", "want", "to", "create", "make", "a", "new", "branch", "called", "named"]
            potential_names = [w for w in words if w not in stop_words]
            
            if len(potential_names) >= 1:
                name = "-".join(potential_names)
                create_branch(name)
                return f"Created and switched to new branch '{name}'."
            
            # If we couldn't easily parse it, ask conversationally
            self.state = "awaiting_create_branch_name"
            return "What would you like to name the new branch? (Type the name below)"

        if intent == "switch_branch":
            words = user_input_lower.split()
            stop_words = ["i", "want", "to", "change", "the", "switch", "checkout", "branch", "please", "can", "you"]
            potential_names = [w for w in words if w not in stop_words]
            
            if len(potential_names) >= 1:
                name = "-".join(potential_names)
                res = checkout(name)
                if "error:" in res and "did not match any file(s)" in res:
                    self.temp_branch = name
                    self.state = "confirm_create_missing_branch"
                    return f"The branch '{name}' does not exist yet. Would you like me to create it for you? (y/n)"
                return f"Switched to branch '{name}'."
                    
            self.state = "awaiting_switch_branch_name"
            return "Which branch would you like to switch to?"

        if intent == "merge":
            words = user_input_lower.split()
            if "merge" in words:
                idx = words.index("merge")
                if idx + 1 < len(words):
                    branch = words[idx + 1]
                    if branch != "with" and branch != "branch":
                        pull_res = merge(branch)
                        if "CONFLICT" in pull_res:
                            self.state = "conflict_wait"
                            return f"⚠️ Merge Conflict with {branch}! Please check your files, resolve, and reply 'resolved'."
                        return pull_res
                        
            self.state = "awaiting_merge_branch_name"
            return "Which branch do you want to merge into this one?"

        if "stash" in user_input_lower:
            if "pop" in user_input_lower:
                return stash_pop()
            return stash()

        if intent == "config":
            name = get_git_config_name()
            email = get_git_config_email()
            msg = f"Your current Git config is:\nName: {name if name else 'Not set'}\nEmail: {email if email else 'Not set'}"
            if "set" in user_input_lower or "change" in user_input_lower or not name:
                self.state = "awaiting_config_name"
                return msg + "\n\nWhat would you like to set your name to?"
            return msg

        if intent == "help":
            return """🚀 **Git AI Agent Help Menu**

Here are the commands I currently support:
- **"upload my code" / "sync"**: One-shot flow to stage, commit, pull, and push.
- **"checkout [branch]" / "switch to [branch]"**: Change your current branch.
- **"create branch [name]"**: Make a new local branch.
- **"merge [branch]"**: Merge another branch into your current one.
- **"undo" / "oops"**: Safely revert your last commit (soft reset).
- **"status"**: See what files have changed.
- **"config"**: View or set your Git username and email.
- **"clear" / "cls"**: Wipe the chat history.

*Tip: You can also click the nodes in the Visual Graph to time-travel!*"""

        if intent == "clear":
            return "__SIGNAL_CLEAR_CHAT__"

        return "I didn't quite catch that. You can ask me to 'upload my code', 'change branch', 'create a new branch', 'show status', 'config user', or type 'help' for all commands."