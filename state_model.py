from git_tools import get_status, get_branch, get_log

class RepoState:
    def __init__(self):
        self.branch = None
        self.status = None
        self.log = None

    def update(self):
        self.branch, _ = get_branch()
        self.status, _ = get_status()
        self.log, _ = get_log()

    def display(self):
        print("Current Branch:", self.branch)
        print("\nStatus:\n", self.status)
        print("\nRecent Commits:\n", self.log)