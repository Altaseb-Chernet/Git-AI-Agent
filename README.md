# Git AI Agent 🧠🌿

Welcome to the **Git AI Agent**! This is a state-of-the-art, fully autonomous, conversational, and visual Git client designed to replace confusing terminal commands with a smart, reactive, interactive experience.

## What Problems Does This Solve?
For decades, developers have struggled with Git's arcane terminal syntax. This system solves several major pain points:
1. **Command Paralysis**: You no longer need to remember obscure commands to set an upstream branch (`git push --set-upstream origin ...`), stash code, or resolve merge states. You can just talk to the AI using conversational English (e.g., *"I want to upload my code"*).
2. **Invisible States**: In the terminal, you never truly know what `HEAD` or your `branches` look like without typing `git log --graph --oneline --all` every five seconds. The **Visual Graph Canvas** gives you an instant, always-updating view of your repository's exact structural state.
3. **"WIP" Commit Messages**: Developers are notoriously bad at writing commit messages. The AI Agent automatically runs `git diff` under the hood and uses an intelligent heuristic algorithm to generate descriptive, file-specific commit messages for you!
4. **Merge Conflict Panic**: When a `git pull` fails in the terminal due to conflicts, developers often panic and try to abort. The AI Agent handles conflicts gracefully, pausing its internal flow, alerting you in Yellow, and waiting patiently until you fix the files and type *"resolved"*.

---

## 🛠 Features & Capabilities

* **Natural Language Processing (NLP)**: The engine uses intelligent matching to understand conversational phrases instead of strict keywords. It automatically parses out filler words.
* **Undo & Time Travel**: Natively supports conversational *"Oops"* and *"Undo"* commands. The visual graph is also fully interactive—you can click directly on a commit node to check it out!
* **Master `sync` Automation**: A "one-shot" flow that stages files, auto-generates a commit message, fetches from the remote, checks for conflicts, and pushes your code—all from a single prompt!
* **GitHub Dark Theme**: A universally accessible, beautiful `#0d1117` native desktop application layout that automatically expands to fit your monitor.
* **Auto-Upstream Tracking**: Say goodbye to tracking branch errors. The AI automatically detects your active branch and links it to origin when pushing or pulling.
* **Multi-Repo Quick Swap**: Quickly jump between different codebase folders using the `📂 Open Repo` button.

---

## 📖 User Manual: How to Use the AI

### 1. Launching the App
Simply run the GUI agent from your Python terminal:
```bash
python gui_agent.py
```
> **Tip:** You can use the `📂 Open Repo` button in the sidebar to switch the AI to controlling any other Git project on your PC!

### 2. General Conversation & Undoing Mistakes
You can type commands like you are talking to a human:
- *"what is happening"* -> Triggers `git status`
- *"record changes"* -> Stashes changes or triggers an auto-commit
- *"Oops, undo my last commit"* -> Safely triggers a `git reset --soft HEAD~1`. It undoes the commit but safely keeps your file modifications in the working directory! If you want to permanently destroy the changes, type *"undo hard"*.

### 3. The "Sync" / "Upload" Flow
If you want to save your progress to GitHub quickly without typing `add`, `commit`, `pull`, and `push`:
- Type: **"I want to upload my code"** or **"sync my branch"**.
- The AI will automatically generate a descriptive commit name based on the files you edited and ask for your permission.
- If the folder is entirely new, the AI will offer to run `git init` and ask you to paste a remote URL!

### 4. Branching out
- To create a branch, type: **"I want to make a new branch"**.
- To switch branches, type: **"checkout main"** or **"change the branch"**. If you misspell the branch or type a branch that *doesn't exist yet*, the AI will smartly catch the Git terminal error and ask to create it.

### 5. Managing Merges
- To combine code, checkout the branch you want to receive the code, and type: **"merge [other-branch]"**.
- If a conflict occurs, DO NOT panic! The AI will stop, warn you, and wait. Resolve the files, then type **"resolved"**.

---

## 📊 How to Read the Visual Graph

The right-side panel is your **Visual Graph**—a live, interactive map of your Git tree.

* **Purple/Pink/Green Nodes (Circles)**: These represent individual commits. **You can click on these circles to instantly Time Travel (checkout) to that specific point in history!**
* **Connecting Lines**: Vertical lines show the history flowing upwards. If you create parallel branches and merge them, you will see the lines dynamically curve outwards and connect back together.
* **Badges `[main]` / `[HEAD]`**: The colorful blocks of text next to nodes. **`HEAD ->`** points to the exact commit your filesystem is currently looking at!
* **Hashes & Messages**: Next to the badges, you will see a 7-character hexadecimal Code (the Commit Hash) followed by the AI-generated commit message.

---

## 🚀 Future Roadmap & What Should Be Improved

While the Git AI Agent is highly capable and production-ready, here is what can make it even better in Version 2.0:

1. **True AI Models for Commit Messages**:
   - Currently, the AI uses a "Regex Heuristic Engine" to count file additions and string together a templated English sentence. 
   - **Improvement**: Integrating an actual LLM API (like the Gemini API / OpenAI) with user-provided API keys to read the full `git diff` content and write highly contextual, semantic commit strings explaining *why* the code was changed.

2. **Multi-Remote Management**:
   - The engine handles `origin` brilliantly but is not equipped for complex Open-Source workflows where users have both an `upstream` source repository and an `origin` fork. 
   - **Improvement**: Add the ability to natively tell the AI *"pull from the upstream master, but push to my remote fork"*.
