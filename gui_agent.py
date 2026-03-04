import tkinter as tk
from tkinter import scrolledtext
from automation_engine import AutomationEngine
from git_tools import get_branch, get_status, get_status_short, get_log_structured

# Color Palette (GitHub Dark High Contrast inspired)
BG_COLOR = "#0d1117"
SIDEBAR_COLOR = "#010409"
TEXT_COLOR = "#c9d1d9"
ACCENT_COLOR = "#58a6ff" # Blue
SUCCESS_COLOR = "#3fb950" # Green
WARN_COLOR = "#d29922" # Yellow
ERROR_COLOR = "#f85149" # Red
INPUT_BG = "#21262d"
GRAPH_BG = "#0d1117"
NODE_COLOR = "#d2a8ff" # Purple nodes
LINE_COLOR = "#30363d" 

engine = AutomationEngine()

def run_command(event=None):
    user_text = entry.get()
    if not user_text.strip(): return
    
    display_output(f"You: {user_text}", "user")
    entry.delete(0, tk.END)
    root.update() # Force UI paint immediately
    
    try:
        output = engine.process(user_text)
        display_output(f"AI: {output}", "ai")
    except Exception as e:
        import traceback
        display_output(f"Internal Error Caught:\n{traceback.format_exc()}", "system")
        
    refresh_status() # Instantly redraw the graph and stats on command finish


timer_id = None

def refresh_status():
    global timer_id
    if timer_id:
        root.after_cancel(timer_id)
        
    status_short = get_status_short()
    
    # Graceful handling if not a repo
    if status_short and "fatal: not a git repository" in status_short.lower():
        branch_label.config(text="🌿 Branch: None")
        stats_label.config(text="Not a Git Repository")
        draw_graph("")  # Clear graph
        timer_id = root.after(3000, refresh_status)
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
    
    timer_id = root.after(3000, refresh_status)

def draw_graph(log_data):
    graph_canvas.delete("all")
    if not log_data.strip() or "fatal" in log_data.lower():
        graph_canvas.create_text(150, 50, text="No Commits Yet", fill=TEXT_COLOR, font=("Consolas", 12))
        return
        
    lines = log_data.strip().split("\n")
    commits = []
    for line in lines:
        parts = line.split("|")
        if len(parts) >= 4:
            commits.append({
                "hash": parts[0].strip(),
                "parents": parts[1].strip().split(),
                "decorations": parts[2].strip(),
                "msg": "|".join(parts[3:]).strip()
            })

    # Assign coordinates for parallel branching
    coords = {}
    current_y = 40
    y_spacing = 50
    x_spacing = 40
    next_col = 0
    assigned_cols = {}
    
    for c in commits:
        h = c["hash"]
        if h not in assigned_cols:
            assigned_cols[h] = next_col
            next_col += 1
            
        coords[h] = (40 + assigned_cols[h] * x_spacing, current_y)
        
        # Propagate columns to parents (detect branching/merging)
        for i, p in enumerate(c["parents"]):
            if p not in assigned_cols:
                assigned_cols[p] = assigned_cols[h] if i == 0 else next_col
                if i != 0: next_col += 1
                    
        current_y += y_spacing
        
    # Phase 1: Draw interconnecting lines
    for c in commits:
        hx, hy = coords[c["hash"]]
        for p in c["parents"]:
            if p in coords:
                px, py = coords[p]
                graph_canvas.create_line(hx, hy + 12, px, py - 12, fill=LINE_COLOR, width=3, smooth=True)
            else:
                graph_canvas.create_line(hx, hy + 12, hx, hy + 35, fill=LINE_COLOR, width=2, dash=(4, 4))
                
    # Phase 2: Draw nodes and badges
    radius = 12
    for c in commits:
        h = c["hash"]
        cx, cy = coords[h]
        dec = c["decorations"]
        
        # Color specific to ref type
        node_col = ACCENT_COLOR if "HEAD" in dec else SUCCESS_COLOR if dec else NODE_COLOR
        
        # Node
        graph_canvas.create_oval(cx-radius, cy-radius, cx+radius, cy+radius, fill=node_col, outline=BG_COLOR, width=2)
        
        text_x = cx + 25
        # Decorations (Branch names, Tags, HEAD)
        if dec:
            dec_clean = dec.replace("(", "").replace(")", "").strip()
            pad = len(dec_clean) * 7
            graph_canvas.create_rectangle(text_x, cy-12, text_x + pad + 10, cy+12, fill="#313244", outline=ACCENT_COLOR, width=1)
            graph_canvas.create_text(text_x + 5, cy, text=dec_clean, fill=ACCENT_COLOR, font=("Consolas", 9, "bold"), anchor="w")
            text_x += pad + 18
        
        # Commit hash and message
        msg = c["msg"]
        trunc_msg = msg[:35] + "..." if len(msg) > 35 else msg
        graph_canvas.create_text(text_x, cy, text=f"{h} {trunc_msg}", fill=TEXT_COLOR, font=("Consolas", 10), anchor="w")
        
    graph_canvas.config(scrollregion=(0, 0, 800, current_y + 50))

def display_output(text, tag=None):
    output_box.config(state=tk.NORMAL)
    output_box.insert(tk.END, "\n" + text + "\n", tag)
    output_box.see(tk.END)
    output_box.config(state=tk.DISABLED)

root = tk.Tk()
root.title("Git AI Assistant")
root.geometry("1100x650")
try:
    root.state("zoomed") # Maximizes window on Windows, solving visual squishing
except:
    pass
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
graph_frame = tk.Frame(main_frame, bg=GRAPH_BG, width=400, padx=10, pady=20)
graph_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True) # Let the graph dynamically expand!
tk.Label(graph_frame, text="Visual Graph", font=bold_font, bg=GRAPH_BG, fg=NODE_COLOR).pack(anchor="w", pady=(0, 10))

graph_canvas = tk.Canvas(graph_frame, bg=GRAPH_BG, highlightthickness=0)
graph_canvas.pack(fill=tk.BOTH, expand=True)

display_output("Welcome! Need to push your code? Just type 'upload'.", "system")
refresh_status()
root.mainloop()