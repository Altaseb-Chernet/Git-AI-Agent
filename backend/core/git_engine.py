import subprocess
import os
import logging
from typing import Tuple, List, Optional, Dict, Any

logger = logging.getLogger(__name__)

class GitExecutionError(Exception):
    \"\"\"Custom exception for Git command failures.\"\"\"
    pass

class GitEngine:
    \"\"\"
    A secure wrapper for executing Git CLI commands via subprocess.
    Includes command validation to prevent arbitrary shell injection.
    \"\"\"
    
    ALLOWED_COMMANDS = {
        "init", "status", "add", "commit", "push", "pull", 
        "fetch", "checkout", "branch", "merge", "log", 
        "remote", "config", "stash", "reset", "revert"
    }

    def __init__(self, repo_path: str = "."):
        self.repo_path = os.path.abspath(repo_path)

    def _validate_command(self, args: List[str]) -> bool:
        \"\"\"
        Validates that the command starts with 'git' and uses an allowed subcommand.
        \"\"\"
        if not args or args[0] != "git":
            return False
        if len(args) > 1 and args[1] not in self.ALLOWED_COMMANDS:
            # Allow some leeway for custom aliases if needed, but strict by default
            logger.warning(f"Potentially unauthorized git subcommand: {args[1]}")
            return False
        return True

    def execute(self, args: List[str]) -> Tuple[bool, str, str]:
        \"\"\"
        Executes a git command safely.
        Returns: (success_bool, stdout_str, stderr_str)
        \"\"\"
        if not self._validate_command(args):
            raise ValueError(f"Command validation failed or unauthorized command: {' '.join(args)}")

        try:
            # shell=False is CRITICAL for security to prevent injection
            result = subprocess.run(
                args,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=False
            )
            success = result.returncode == 0
            return success, result.stdout.strip(), result.stderr.strip()
        except FileNotFoundError:
            return False, "", "Git executable not found in system path."
        except Exception as e:
            logger.error(f"Error executing git command: {e}")
            return False, "", str(e)

    # --- Convenience Methods ---

    def status(self) -> Dict[str, Any]:
        success, out, err = self.execute(["git", "status", "--porcelain"])
        if not success:
            raise GitExecutionError(err)
        
        files = []
        if out:
            for line in out.split('\\n'):
                if len(line) >= 3:
                    state = line[:2].strip()
                    path = line[3:].strip()
                    files.append({"state": state, "path": path})
        return {"changed_files": files}

    def get_current_branch(self) -> Optional[str]:
        success, out, err = self.execute(["git", "branch", "--show-current"])
        return out if success else None
    
    def is_repo(self) -> bool:
        success, _, _ = self.execute(["git", "rev-parse", "--is-inside-work-tree"])
        return success

    def add_all(self):
        return self.execute(["git", "add", "."])
    
    def commit(self, message: str):
        return self.execute(["git", "commit", "-m", message])
        
    def push(self, remote: str = "origin", branch: str = ""):
        if not branch:
            branch = self.get_current_branch() or "main"
        return self.execute(["git", "push", "-u", remote, branch])
