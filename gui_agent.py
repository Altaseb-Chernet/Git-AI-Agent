import tkinter as tk
from tkinter import scrolledtext, filedialog, ttk
import os
from automation_engine import AutomationEngine
from git_tools import get_branch, get_status, get_status_short, get_log_structured, get_git_config_name, get_git_config_email

# Color Palette (Modern Dark)
BG_COLOR = "#0b0f14"
SURFACE_1 = "#0f1620"
SURFACE_2 = "#121b27"
SURFACE_3 = "#182233"
BORDER_COLOR = "#243044"
TEXT_COLOR = "#e6edf3"
TEXT_MUTED = "#9fb0c3"
ACCENT_COLOR = "#4c8dff"
ACCENT_HOVER = "#6aa0ff"
SUCCESS_COLOR = "#3fb950"
WARN_COLOR = "#f0b429"
ERROR_COLOR = "#ff6b6b"
INPUT_BG = "#0a111a"
GRAPH_BG = "#0f1620"
NODE_COLOR = "#c4a1ff"
LINE_COLOR = "#2a3851"
BUTTON_COLOR = "#172132"
BUTTON_HOVER = "#1e2b41"

APP_TITLE = "Git AI Agent"
APP_SUBTITLE = "Chat-driven Git automation with live repo insights"
engine = AutomationEngine()

def _font(preferred, size, *styles):
    # Tkinter will gracefully fall back if a font isn't present.
    return (preferred, size, *styles) if styles else (preferred, size)

def _style_button(btn: tk.Button, *, kind: str = "neutral"):
    if kind == "accent":
        base_bg, hover_bg, fg, active_bg = ACCENT_COLOR, ACCENT_HOVER, "#ffffff", ACCENT_HOVER
    else:
        base_bg, hover_bg, fg, active_bg = BUTTON_COLOR, BUTTON_HOVER, TEXT_COLOR, BUTTON_HOVER

    btn.configure(
        bg=base_bg,
        fg=fg,
        activebackground=active_bg,
        activeforeground=fg,
        bd=0,
        highlightthickness=0,
        relief="flat",
        cursor="hand2",
    )
    btn.bind("<Enter>", lambda _e: btn.configure(bg=hover_bg))
    btn.bind("<Leave>", lambda _e: btn.configure(bg=base_bg))

def _make_card(parent, *, bg=SURFACE_2, padx=14, pady=14):
    outer = tk.Frame(parent, bg=bg, highlightthickness=1, highlightbackground=BORDER_COLOR)
    inner = tk.Frame(outer, bg=bg, padx=padx, pady=pady)
    inner.pack(fill=tk.BOTH, expand=True)
    return outer, inner

def _set_entry_placeholder(e: tk.Entry, placeholder: str):
    def on_focus_in(_):
        if e.get() == placeholder and e.cget("fg") == TEXT_MUTED:
            e.delete(0, tk.END)
            e.config(fg=TEXT_COLOR)

    def on_focus_out(_):
        if not e.get().strip():
            e.delete(0, tk.END)
            e.insert(0, placeholder)
            e.config(fg=TEXT_MUTED)

    e.insert(0, placeholder)
    e.config(fg=TEXT_MUTED)
    e.bind("<FocusIn>", on_focus_in)
    e.bind("<FocusOut>", on_focus_out)

def open_folder():
    folder = filedialog.askdirectory()
    if folder:
        os.chdir(folder)
        repo_label.config(text=f"📁 {folder}")
        display_output(f"Switched repository to: {folder}", "system")
        refresh_status()

def run_command(event=None):
    user_text = entry.get()
    if not user_text.strip(): return
    
    display_output(f"You: {user_text}", "user")
    entry.delete(0, tk.END)
    root.update() # Force UI paint immediately
    
    try:
        output = engine.process(user_text)
        if output == "__SIGNAL_CLEAR_CHAT__":
            output_box.config(state=tk.NORMAL)
            output_box.delete('1.0', tk.END)
            output_box.config(state=tk.DISABLED)
            display_output("Chat cleared.", "system")
        else:
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
        branch_label.config(text="🌿 Branch: —")
        stats_label.config(text="Not a Git repository in this folder.")
        draw_graph("")  # Clear graph
        status_bar.config(text="Ready • Not a Git repository")
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
            
    stats_label.config(
        text=(
            f"🔄 Modified  {modified}\n"
            f"✨ Untracked {untracked}\n"
            f"➕ Added     {added}\n"
            f"🗑️ Deleted   {deleted}"
        )
    )
    
    # Update visual graph
    log_data = get_log_structured()
    draw_graph(log_data)
    
    # Update User Info
    user_name = get_git_config_name()
    user_email = get_git_config_email()
    user_label.config(
        text=(
            f"👤 {user_name if user_name else 'User not set'}\n"
            f"📧 {user_email if user_email else 'Email not set'}"
        )
    )

    status_bar.config(text=f"Ready • Branch {branch} • Modified {modified} • Untracked {untracked}")
    
    timer_id = root.after(3000, refresh_status)

def draw_graph(log_data):
    graph_canvas.delete("all")
    if not log_data.strip() or "fatal" in log_data.lower():
        graph_canvas.create_text(200, 70, text="No commits yet", fill=TEXT_MUTED, font=ui_font_mono)
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
        graph_canvas.create_oval(
            cx-radius, cy-radius, cx+radius, cy+radius,
            fill=node_col, outline=GRAPH_BG, width=2, tags=(h, "node")
        )
        
        text_x = cx + 25
        # Decorations (Branch names, Tags, HEAD)
        if dec:
            dec_clean = dec.replace("(", "").replace(")", "").strip()
            pad = len(dec_clean) * 7
            graph_canvas.create_rectangle(
                text_x, cy-12, text_x + pad + 10, cy+12,
                fill=SURFACE_3, outline=BORDER_COLOR, width=1
            )
            graph_canvas.create_text(
                text_x + 6, cy, text=dec_clean, fill=ACCENT_COLOR, font=ui_font_mono_small_bold, anchor="w"
            )
            text_x += pad + 18
        
        # Commit hash and message
        msg = c["msg"]
        trunc_msg = msg[:75] + "..." if len(msg) > 75 else msg
        graph_canvas.create_text(text_x, cy, text=f"{h} {trunc_msg}", fill=TEXT_COLOR, font=ui_font_mono_small, anchor="w")
        
    graph_canvas.config(scrollregion=(0, 0, 800, current_y + 50))

def on_node_click(event):
    item = graph_canvas.find_withtag("current")
    if not item: return
    tags = graph_canvas.gettags(item[0])
    if tags:
        h = tags[0]
        entry.delete(0, tk.END)
        entry.insert(0, f"switch to {h}")
        run_command()

def display_output(text, tag=None):
    output_box.config(state=tk.NORMAL)
    output_box.insert(tk.END, "\n" + text + "\n", tag)
    output_box.see(tk.END)
    output_box.config(state=tk.DISABLED)

root = tk.Tk()
root.title(APP_TITLE)
root.geometry("1180x720")
try:
    root.state("zoomed") # Maximizes window on Windows, solving visual squishing
except:
    pass
root.configure(bg=BG_COLOR)

root.minsize(1080, 640)

style = ttk.Style()
try:
    style.theme_use("clam")
except:
    pass

ui_font_title = _font("Segoe UI Variable Display", 20, "bold")
ui_font_h2 = _font("Segoe UI Variable Display", 13, "bold")
ui_font_body = _font("Segoe UI", 11)
ui_font_body_bold = _font("Segoe UI", 11, "bold")
ui_font_small = _font("Segoe UI", 10)
ui_font_mono = _font("Cascadia Mono", 11)
ui_font_mono_small = _font("Cascadia Mono", 10)
ui_font_mono_small_bold = _font("Cascadia Mono", 10, "bold")

main_frame = tk.Frame(root, bg=BG_COLOR)
main_frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=16)
main_frame.grid_columnconfigure(0, weight=0, minsize=260)
main_frame.grid_columnconfigure(1, weight=1)
main_frame.grid_columnconfigure(2, weight=1, minsize=420)
main_frame.grid_rowconfigure(1, weight=1)

# Header
header_outer, header = _make_card(main_frame, bg=SURFACE_1, padx=16, pady=14)
header_outer.grid(row=0, column=0, columnspan=3, sticky="nsew", pady=(0, 14))
header.grid_columnconfigure(0, weight=1)

title_col = tk.Frame(header, bg=SURFACE_1)
title_col.grid(row=0, column=0, sticky="w")
tk.Label(title_col, text=APP_TITLE, font=ui_font_title, bg=SURFACE_1, fg=TEXT_COLOR).pack(anchor="w")
tk.Label(title_col, text=APP_SUBTITLE, font=ui_font_small, bg=SURFACE_1, fg=TEXT_MUTED).pack(anchor="w", pady=(2, 0))

actions_col = tk.Frame(header, bg=SURFACE_1)
actions_col.grid(row=0, column=1, sticky="e")
open_btn = tk.Button(actions_col, text="📂 Open repository", command=open_folder, font=ui_font_body_bold, padx=14, pady=8)
_style_button(open_btn, kind="neutral")
open_btn.pack(side=tk.RIGHT)

repo_label = tk.Label(header, text=f"📁 {os.getcwd()}", font=ui_font_small, bg=SURFACE_1, fg=TEXT_MUTED)
repo_label.grid(row=1, column=0, columnspan=2, sticky="w", pady=(10, 0))

# 1. Sidebar (Stats)
sidebar_outer, sidebar = _make_card(main_frame, bg=SURFACE_2, padx=14, pady=14)
sidebar_outer.grid(row=1, column=0, sticky="nsew", padx=(0, 14))
sidebar.grid_rowconfigure(6, weight=1)

tk.Label(sidebar, text="Repository", font=ui_font_h2, bg=SURFACE_2, fg=TEXT_COLOR).pack(anchor="w")
tk.Label(sidebar, text="Live status updates every 3 seconds", font=ui_font_small, bg=SURFACE_2, fg=TEXT_MUTED).pack(anchor="w", pady=(2, 12))

branch_label = tk.Label(sidebar, text="🌿 Branch: …", font=ui_font_body, bg=SURFACE_2, fg=TEXT_COLOR)
branch_label.pack(anchor="w", pady=5)
tk.Frame(sidebar, height=1, bg=BORDER_COLOR).pack(fill=tk.X, pady=12)

user_label = tk.Label(sidebar, text="👤 …", font=ui_font_small, bg=SURFACE_2, fg=TEXT_COLOR, justify=tk.LEFT)
user_label.pack(anchor="w", pady=5)
tk.Frame(sidebar, height=1, bg=BORDER_COLOR).pack(fill=tk.X, pady=12)

stats_label = tk.Label(sidebar, text="Loading…", font=ui_font_body, bg=SURFACE_2, fg=TEXT_COLOR, justify=tk.LEFT)
stats_label.pack(anchor="w", pady=5)

# Quick tips
tips = tk.Label(
    sidebar,
    text="Tips\n- Try: status, log, branch, commit\n- Type “upload” to push\n- Click a commit to switch",
    font=ui_font_small,
    bg=SURFACE_2,
    fg=TEXT_MUTED,
    justify=tk.LEFT,
)
tips.pack(anchor="w", pady=(14, 0), fill=tk.X)

# 2. Chat Area (Center)
chat_outer, chat_frame = _make_card(main_frame, bg=SURFACE_2, padx=14, pady=14)
chat_outer.grid(row=1, column=1, sticky="nsew", padx=(0, 14))
chat_frame.grid_rowconfigure(1, weight=1)
chat_frame.grid_columnconfigure(0, weight=1)

tk.Label(chat_frame, text="Assistant", font=ui_font_h2, bg=SURFACE_2, fg=TEXT_COLOR).grid(row=0, column=0, sticky="w")
tk.Label(chat_frame, text="Ask for Git actions in plain English", font=ui_font_small, bg=SURFACE_2, fg=TEXT_MUTED).grid(row=0, column=0, sticky="e")

output_box = scrolledtext.ScrolledText(
    chat_frame,
    height=20,
    bg=INPUT_BG,
    fg=TEXT_COLOR,
    font=ui_font_mono,
    bd=0,
    padx=12,
    pady=12,
    state=tk.DISABLED,
    insertbackground=TEXT_COLOR,
)
output_box.grid(row=1, column=0, sticky="nsew", pady=(10, 12))
output_box.tag_config("user", foreground=SUCCESS_COLOR, font=ui_font_mono_small_bold, lmargin1=8, lmargin2=8, rmargin=8)
output_box.tag_config("ai", foreground=ACCENT_COLOR, font=ui_font_mono_small, lmargin1=8, lmargin2=8, rmargin=8)
output_box.tag_config("system", foreground=WARN_COLOR, font=ui_font_mono_small, lmargin1=8, lmargin2=8, rmargin=8)

input_row = tk.Frame(chat_frame, bg=SURFACE_2)
input_row.grid(row=2, column=0, sticky="ew")
input_row.grid_columnconfigure(0, weight=1)

entry = tk.Entry(
    input_row,
    bg=INPUT_BG,
    fg=TEXT_COLOR,
    font=ui_font_body,
    bd=0,
    highlightthickness=1,
    highlightbackground=BORDER_COLOR,
    highlightcolor=ACCENT_COLOR,
    insertbackground=TEXT_COLOR,
)
entry.grid(row=0, column=0, sticky="ew", ipady=10, padx=(0, 10))
_set_entry_placeholder(entry, "Type a request… e.g., “show status” or “create a new branch feature/x”")
entry.bind("<Return>", run_command)

send_btn = tk.Button(input_row, text="Send", command=run_command, font=ui_font_body_bold, padx=16, pady=10)
_style_button(send_btn, kind="accent")
send_btn.grid(row=0, column=1, sticky="e")

# 3. Visual Graph Area (Right)
graph_outer, graph_frame = _make_card(main_frame, bg=GRAPH_BG, padx=14, pady=14)
graph_outer.grid(row=1, column=2, sticky="nsew")
graph_frame.grid_rowconfigure(1, weight=1)
graph_frame.grid_columnconfigure(0, weight=1)

tk.Label(graph_frame, text="Commit graph", font=ui_font_h2, bg=GRAPH_BG, fg=TEXT_COLOR).grid(row=0, column=0, sticky="w")
tk.Label(graph_frame, text="Click a commit node to switch", font=ui_font_small, bg=GRAPH_BG, fg=TEXT_MUTED).grid(row=0, column=0, sticky="e")

graph_wrap = tk.Frame(graph_frame, bg=GRAPH_BG, highlightthickness=1, highlightbackground=BORDER_COLOR)
graph_wrap.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
graph_wrap.grid_rowconfigure(0, weight=1)
graph_wrap.grid_columnconfigure(0, weight=1)

graph_canvas = tk.Canvas(graph_wrap, bg=GRAPH_BG, highlightthickness=0)
graph_canvas.grid(row=0, column=0, sticky="nsew")
graph_scroll = ttk.Scrollbar(graph_wrap, orient="vertical", command=graph_canvas.yview)
graph_scroll.grid(row=0, column=1, sticky="ns")
graph_canvas.configure(yscrollcommand=graph_scroll.set)

# Bind the 'node' tag to the interactive click function
graph_canvas.tag_bind("node", "<Button-1>", on_node_click)
graph_canvas.tag_bind("node", "<Enter>", lambda e: graph_canvas.config(cursor="hand2"))
graph_canvas.tag_bind("node", "<Leave>", lambda e: graph_canvas.config(cursor=""))

# Status bar
status_bar = tk.Label(root, text="Ready", bg=BG_COLOR, fg=TEXT_MUTED, font=ui_font_small, anchor="w")
status_bar.pack(fill=tk.X, padx=16, pady=(0, 10))

display_output("Welcome! Try: “status”, “log”, or “upload”.", "system")
refresh_status()
root.mainloop()