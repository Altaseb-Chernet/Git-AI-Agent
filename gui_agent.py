import tkinter as tk
from tkinter import scrolledtext
from automation_engine import AutomationEngine
from git_tools import get_branch, get_status, get_status_short, get_log_structured

# Color Palette (Catppuccin Mocha inspired)
BG_COLOR = "#1e1e2e"
SIDEBAR_COLOR = "#181825"
TEXT_COLOR = "#cdd6f4"
ACCENT_COLOR = "#89b4fa" # Blue
SUCCESS_COLOR = "#a6e3a1" # Green
WARN_COLOR = "#f9e2af" # Yellow
ERROR_COLOR = "#f38ba8" # Red
INPUT_BG = "#313244"
GRAPH_BG = "#11111b"
NODE_COLOR = "#f5c2e7" # Pink nodes
LINE_COLOR = "#585b70" 

engine = AutomationEngine()

def run_command(event=None):
    user_text = entry.get()
    if not user_text.strip(): return
    
    display_output(f"You: {user_text}", "user")
    output = engine.process(user_text)
    display_output(f"AI: {output}", "ai")
    entry.delete(0, tk.END)
    refresh_status()

def refresh_status():
    status_short = get_status_short()
    
    # Graceful handling if not a repo
    if "fatal: not a git repository" in status_short.lower() or status_short == "":
        branch_label.config(text="🌿 Branch: None")
        stats_label.config(text="Not a Git Repository")
        draw_graph("")  # Clear graph
        root.after(3000, refresh_status)
        return
        
    branch = get_branch().strip()
    branch_label.config(text=f"🌿 Branch: {branch}")
    
    modified, untracked, added, deleted = 0, 0, 0, 0
    if status_short is not None:
        for line in status_short.splitlines():
            if len(line) < 2: continue
            state = line[0:2]
            if 'A' in state: added += 1
            elif 'D' in state: deleted += 1
            elif '?' in state: untracked += 1
            else: modified += 1
            
    stats_label.config(text=f"🔄 Modified: {modified}\n\n✨ Untracked: {untracked}\n\n➕ Added: {added}\n\n🗑️ Deleted: {deleted}")
    
    # Update visual graph
    log_data = get_log_structured()
    draw_graph(log_data)
    
    root.after(3000, refresh_status)

def draw_graph(log_data):
    graph_canvas.delete("all")
    if not log_data.strip() or "fatal" in log_data.lower():
        graph_canvas.create_text(150, 50, text="No Commits Yet", fill=TEXT_COLOR, font=("Consolas", 12))
        return
        
    lines = log_data.strip().split("\n")
    y_offset = 40
    x_offset = 40
    radius = 12
    
    # Draw vertical line connecting nodes
    if len(lines) > 1:
        graph_canvas.create_line(x_offset, y_offset, x_offset, y_offset + (len(lines)-1)*40, fill=LINE_COLOR, width=3)
        
    for i, line in enumerate(lines):
        parts = line.split("|")
        if len(parts) >= 3:
            hash_val, parents, msg = parts[0], parts[1], "|".join(parts[2:])
            
            # Draw Circle
            graph_canvas.create_oval(x_offset-radius, y_offset-radius, x_offset+radius, y_offset+radius, fill=NODE_COLOR, outline=BG_COLOR, width=2)
            
            # Add text (hash + trunc msg)
            trunc_msg = msg[:20] + "..." if len(msg) > 20 else msg
            graph_canvas.create_text(x_offset + 30, y_offset, text=f"{hash_val} {trunc_msg}", fill=TEXT_COLOR, font=("Consolas", 10), anchor="w")
            
            y_offset += 40

def display_output(text, tag=None):
    output_box.config(state=tk.NORMAL)
    output_box.insert(tk.END, "\n" + text + "\n", tag)
    output_box.see(tk.END)
    output_box.config(state=tk.DISABLED)

root = tk.Tk()
root.title("Git AI Assistant")
root.geometry("1100x650")
root.configure(bg=BG_COLOR)

bold_font, normal_font = ("Consolas", 14, "bold"), ("Consolas", 11)

main_frame = tk.Frame(root, bg=BG_COLOR)
main_frame.pack(fill=tk.BOTH, expand=True)

# 1. Sidebar (Stats)
sidebar = tk.Frame(main_frame, bg=SIDEBAR_COLOR, width=220, padx=15, pady=20)
sidebar.pack(side=tk.LEFT, fill=tk.Y)
tk.Label(sidebar, text="Git Status", font=bold_font, bg=SIDEBAR_COLOR, fg=ACCENT_COLOR).pack(anchor="w", pady=(0, 15))
branch_label = tk.Label(sidebar, text="🌿 Branch: ...", font=normal_font, bg=SIDEBAR_COLOR, fg=TEXT_COLOR)
branch_label.pack(anchor="w", pady=5)
tk.Frame(sidebar, height=2, bg=INPUT_BG).pack(fill=tk.X, pady=15)
stats_label = tk.Label(sidebar, text="Loading...", font=normal_font, bg=SIDEBAR_COLOR, fg=TEXT_COLOR, justify=tk.LEFT)
stats_label.pack(anchor="w", pady=5)

# 2. Chat Area (Center)
chat_frame = tk.Frame(main_frame, bg=BG_COLOR, padx=20, pady=20)
chat_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
tk.Label(chat_frame, text="✨ AI Assistant", font=("Consolas", 18, "bold"), bg=BG_COLOR, fg=ACCENT_COLOR).pack(anchor="w", pady=(0, 10))

output_box = scrolledtext.ScrolledText(chat_frame, height=20, bg=INPUT_BG, fg=TEXT_COLOR, font=normal_font, bd=0, padx=10, pady=10, state=tk.DISABLED)
output_box.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
output_box.tag_config("user", foreground=SUCCESS_COLOR, font=("Consolas", 11, "bold"))
output_box.tag_config("ai", foreground=ACCENT_COLOR)
output_box.tag_config("system", foreground=WARN_COLOR, font=("Consolas", 10, "italic"))

input_frame = tk.Frame(chat_frame, bg=BG_COLOR)
input_frame.pack(fill=tk.X)
entry = tk.Entry(input_frame, bg=INPUT_BG, fg=TEXT_COLOR, font=normal_font, bd=0, insertbackground=TEXT_COLOR)
entry.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, ipady=8, padx=(0, 10))
entry.bind("<Return>", run_command)
tk.Button(input_frame, text="Send", command=run_command, bg=ACCENT_COLOR, fg=BG_COLOR, font=("Consolas", 11, "bold"), bd=0, activebackground=SUCCESS_COLOR, padx=15).pack(side=tk.RIGHT, fill=tk.Y)

# 3. Visual Graph Area (Right)
graph_frame = tk.Frame(main_frame, bg=GRAPH_BG, width=300, padx=10, pady=20)
graph_frame.pack(side=tk.RIGHT, fill=tk.Y)
tk.Label(graph_frame, text="Visual Graph", font=bold_font, bg=GRAPH_BG, fg=NODE_COLOR).pack(anchor="w", pady=(0, 10))

graph_canvas = tk.Canvas(graph_frame, bg=GRAPH_BG, highlightthickness=0, width=280)
graph_canvas.pack(fill=tk.BOTH, expand=True)

display_output("Welcome! Need to push your code? Just type 'upload'.", "system")
refresh_status()
root.mainloop()