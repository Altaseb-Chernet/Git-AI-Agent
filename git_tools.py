import subprocess

def run_git_command(command):
    try:
        result = subprocess.run(
            ["git"] + command,
            capture_output=True,
            text=True
        )
        out = result.stdout if result.stdout else ""
        err = result.stderr if result.stderr else ""
        return out + err
    except Exception as e:
        return f"Error executing git {command[0]}: {str(e)}"


def get_status():
    return run_git_command(["status"])


def get_branch():
    return run_git_command(["branch", "--show-current"])


def add_all():
    return run_git_command(["add", "."])


def commit(message):
    return run_git_command(["commit", "-m", message])


def push():
    branch = get_branch().strip()
    return run_git_command(["push", "-u", "origin", branch])


def create_branch(name):
    return run_git_command(["checkout", "-b", name])

def checkout(name):
    return run_git_command(["checkout", name])


def get_status_short():
    return run_git_command(["status", "-s"])


def init_repo():
    return run_git_command(["init"])


def get_remotes():
    return run_git_command(["remote", "-v"])


def add_remote(url):
    return run_git_command(["remote", "add", "origin", url])


def push_origin_main():
    run_git_command(["branch", "-M", "main"])
    return run_git_command(["push", "-u", "origin", "main"])

def get_log_structured():
    # Returns: short_hash|parent_hashes|decorations|message
    return run_git_command(["log", "--pretty=format:%h|%p|%d|%s", "-n", "15"])

def git_config(name, email):
    run_git_command(["config", "user.name", name])
    return run_git_command(["config", "user.email", email])

def get_diff():
    return run_git_command(["diff", "--cached"])

def get_untracked_diff():
    return run_git_command(["diff"]) 

def add_tracked():
    return run_git_command(["add", "-u"])

def add_specific(file):
    return run_git_command(["add", file])

def merge(branch):
    return run_git_command(["merge", branch])

def rebase(branch):
    return run_git_command(["rebase", branch])

def tag(name):
    return run_git_command(["tag", name])

def stash():
    return run_git_command(["stash"])

def stash_pop():
    return run_git_command(["stash", "pop"])

def pull():
    branch = get_branch().strip()
    return run_git_command(["pull", "origin", branch])
