import tkinter as tk
from tkinter import scrolledtext
from automation_engine import AutomationEngine
from git_tools import get_branch, get_status, get_status_short

# Color Palette (Catppuccin Mocha inspired)
BG_COLOR = "#1e1e2e"
SIDEBAR_COLOR = "#181825"
TEXT_COLOR = "#cdd6f4"
ACCENT_COLOR = "#89b4fa" # Blue
SUCCESS_COLOR = "#a6e3a1" # Green
WARN_COLOR = "#f9e2af" # Yellow
ERROR_COLOR = "#f38ba8" # Red
INPUT_BG = "#313244"

engine = AutomationEngine()

def run_command(event=None):
    user_text = entry.get()
    if not user_text.strip():
        return
    
    # Display user input
    display_output(f"You: {user_text}", "user")
    
    # Process
    output = engine.process(user_text)
    
    # Display AI output
    display_output(f"AI: {output}", "ai")
    entry.delete(0, tk.END)
    
    # Trigger an immediate visual refresh
    refresh_status()

def refresh_status():
    branch = get_branch().strip()
    status_short = get_status_short()
    
    branch_label.config(text=f"🌿 Branch: {branch}")
    
    # Parse short status
    modified = 0
    untracked = 0
    added = 0
    deleted = 0
    
    if status_short is not None:
        for line in status_short.splitlines():
            if len(line) < 2:
                continue
            state = line[0:2]
            if 'A' in state: added += 1
            elif 'D' in state: deleted += 1
            elif '?' in state: untracked += 1
            else: modified += 1
        
    status_text = f"🔄 Modified: {modified}\n\n"
    status_text += f"✨ Untracked: {untracked}\n\n"
    status_text += f"➕ Added: {added}\n\n"
    status_text += f"🗑️ Deleted: {deleted}"
    
    stats_label.config(text=status_text)
    
    # Auto-refresh loop every 3 seconds
    root.after(3000, refresh_status)

def display_output(text, tag=None):
    output_box.config(state=tk.NORMAL)
    output_box.insert(tk.END, "\n" + text + "\n", tag)
    output_box.see(tk.END)
    output_box.config(state=tk.DISABLED)

# Window Setup
root = tk.Tk()
root.title("Git AI Assistant")
root.geometry("850x600")
root.configure(bg=BG_COLOR)

# Fonts
bold_font = ("Consolas", 14, "bold")
normal_font = ("Consolas", 11)

# Layout: Main Area
main_frame = tk.Frame(root, bg=BG_COLOR)
main_frame.pack(fill=tk.BOTH, expand=True)

# Sidebar
sidebar = tk.Frame(main_frame, bg=SIDEBAR_COLOR, width=220, padx=15, pady=20)
sidebar.pack(side=tk.LEFT, fill=tk.Y)

sidebar_title = tk.Label(sidebar, text="Git Status", font=bold_font, bg=SIDEBAR_COLOR, fg=ACCENT_COLOR)
sidebar_title.pack(anchor="w", pady=(0, 15))

branch_label = tk.Label(sidebar, text="🌿 Branch: ...", font=normal_font, bg=SIDEBAR_COLOR, fg=TEXT_COLOR)
branch_label.pack(anchor="w", pady=5)

tk.Frame(sidebar, height=2, bg=INPUT_BG).pack(fill=tk.X, pady=15) # Divider

stats_label = tk.Label(sidebar, text="Loading...", font=normal_font, bg=SIDEBAR_COLOR, fg=TEXT_COLOR, justify=tk.LEFT)
stats_label.pack(anchor="w", pady=5)

# Content Area
content_frame = tk.Frame(main_frame, bg=BG_COLOR, padx=20, pady=20)
content_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

header = tk.Label(content_frame, text="✨ Git AI Assistant", font=("Consolas", 18, "bold"), bg=BG_COLOR, fg=ACCENT_COLOR)
header.pack(anchor="w", pady=(0, 10))

# Output Box
output_box = scrolledtext.ScrolledText(content_frame, height=20, bg=INPUT_BG, fg=TEXT_COLOR, 
                                       font=normal_font, bd=0, padx=10, pady=10, state=tk.DISABLED)
output_box.pack(fill=tk.BOTH, expand=True, pady=(0, 15))

# Configure text tags for smartly colored output
output_box.tag_config("user", foreground=SUCCESS_COLOR, font=("Consolas", 11, "bold"))
output_box.tag_config("ai", foreground=ACCENT_COLOR)
output_box.tag_config("error", foreground=ERROR_COLOR)
output_box.tag_config("system", foreground=WARN_COLOR, font=("Consolas", 10, "italic"))

# Input Area
input_frame = tk.Frame(content_frame, bg=BG_COLOR)
input_frame.pack(fill=tk.X)

entry = tk.Entry(input_frame, bg=INPUT_BG, fg=TEXT_COLOR, font=normal_font, bd=0, insertbackground=TEXT_COLOR)
entry.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, ipady=8, padx=(0, 10))
entry.bind("<Return>", run_command)

run_button = tk.Button(input_frame, text="Send", command=run_command, bg=ACCENT_COLOR, fg=BG_COLOR, 
                       font=("Consolas", 11, "bold"), bd=0, activebackground=SUCCESS_COLOR, padx=15)
run_button.pack(side=tk.RIGHT, fill=tk.Y)

# Initial system message
display_output("Welcome to your Git AI Workspace! Ask me anything.", "system")

# Start auto-refresh loop
refresh_status()

root.mainloop()