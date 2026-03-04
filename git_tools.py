import subprocess

def run_git_command(command):
    result = subprocess.run(
        ["git"] + command,
        capture_output=True,
        text=True
    )
    return result.stdout + result.stderr


def get_status():
    return run_git_command(["status"])


def get_branch():
    return run_git_command(["branch", "--show-current"])


def add_all():
    return run_git_command(["add", "."])


def commit(message):
    return run_git_command(["commit", "-m", message])


def push():
    return run_git_command(["push"])


def create_branch(name):
    return run_git_command(["checkout", "-b", name])


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