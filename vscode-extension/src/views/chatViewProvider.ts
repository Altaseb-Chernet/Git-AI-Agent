import * as vscode from "vscode";
import { BackendManager, ChatResponse, RepoStatus } from "../backend/backendManager";

type WebviewInbound =
  | { type: "ready" }
  | { type: "sendMessage"; message: string }
  | { type: "refreshStatus" }
  | { type: "quickAction"; action: "sync" | "status" | "newBranch" | "checkout" | "openSettings" };

type WebviewOutbound =
  | { type: "status"; status: RepoStatus }
  | { type: "chatResponse"; message: string; raw: ChatResponse }
  | { type: "error"; message: string };

export class ChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "gitAiAgent.chatView";

  private view: vscode.WebviewView | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly backend: BackendManager
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg: WebviewInbound) => {
      if (msg.type === "ready") {
        await this.safeRefreshStatus();
        return;
      }

      if (msg.type === "refreshStatus") {
        await this.safeRefreshStatus();
        return;
      }

      if (msg.type === "quickAction") {
        if (msg.action === "openSettings") {
          await vscode.commands.executeCommand("workbench.action.openSettings", "Git AI Agent");
          return;
        }
        if (msg.action === "status") {
          await this.safeChat("status");
          await this.safeRefreshStatus();
          return;
        }
        if (msg.action === "sync") {
          await this.safeChat("upload my code");
          await this.safeRefreshStatus();
          return;
        }
        if (msg.action === "newBranch") {
          const name = await vscode.window.showInputBox({
            title: "Create branch",
            prompt: "Branch name",
            placeHolder: "feature/my-branch",
          });
          if (!name) return;
          await this.safeChat(`create branch ${name}`);
          await this.safeRefreshStatus();
          return;
        }
        if (msg.action === "checkout") {
          const name = await vscode.window.showInputBox({
            title: "Checkout branch",
            prompt: "Branch name",
            placeHolder: "main",
          });
          if (!name) return;
          await this.safeChat(`checkout ${name}`);
          await this.safeRefreshStatus();
          return;
        }
      }

      if (msg.type === "sendMessage") {
        await this.safeChat(msg.message);
        await this.safeRefreshStatus();
        return;
      }
    });
  }

  private post(msg: WebviewOutbound) {
    this.view?.webview.postMessage(msg);
  }

  private async safeRefreshStatus() {
    try {
      await this.backend.ensureStarted({});
      const status = await this.backend.getStatus();
      this.post({ type: "status", status });
    } catch (e) {
      this.post({
        type: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  private async safeChat(message: string) {
    try {
      await this.backend.ensureStarted({});
      const res = await this.backend.chat(message);
      this.post({ type: "chatResponse", message, raw: res });
    } catch (e) {
      this.post({
        type: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = String(Date.now());
    const style = `
      :root {
        --bg: var(--vscode-sideBar-background);
        --panel: var(--vscode-editor-background);
        --text: var(--vscode-foreground);
        --muted: var(--vscode-descriptionForeground);
        --accent: var(--vscode-button-background);
        --accentText: var(--vscode-button-foreground);
        --accentHover: var(--vscode-button-hoverBackground);
        --border: var(--vscode-panel-border);
        --input: var(--vscode-input-background);
        --inputText: var(--vscode-input-foreground);
        --bubbleUser: color-mix(in srgb, var(--vscode-gitDecoration-addedResourceForeground, #2ea043) 18%, transparent);
        --bubbleAI: color-mix(in srgb, var(--vscode-focusBorder) 14%, transparent);
        --danger: var(--vscode-errorForeground);
      }
      html, body { height: 100%; }
      body {
        margin: 0;
        padding: 10px 10px 12px;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, Segoe WPC, Segoe UI, system-ui, sans-serif;
      }
      .card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 10px;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 12px;
      }
      .titleRow { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .title { font-weight: 700; letter-spacing: .2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .subtle { font-size: 12px; color: var(--muted); }
      .btnRow { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
      .chat {
        margin-top: 10px;
        height: calc(100vh - 260px);
        overflow: auto;
        padding: 12px;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 12px;
      }
      .msg { display: flex; margin: 0 0 10px 0; }
      .bubble {
        max-width: 95%;
        padding: 10px 10px;
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
        box-shadow: 0 1px 0 rgba(0,0,0,.08);
      }
      .msg.user { justify-content: flex-end; }
      .msg.user .bubble { background: var(--bubbleUser); }
      .msg.ai .bubble { background: var(--bubbleAI); }
      .msg.err .bubble { background: color-mix(in srgb, var(--danger) 9%, transparent); border-color: color-mix(in srgb, var(--danger) 30%, transparent); }
      .meta { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
      .who { font-weight: 700; font-size: 12px; color: var(--muted); }
      .text { white-space: pre-wrap; line-height: 1.45; }
      .actionsTaken { margin-top: 8px; font-size: 12px; color: var(--muted); }
      .composer {
        margin-top: 10px;
        padding: 10px;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 12px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      textarea {
        resize: vertical;
        min-height: 44px;
        max-height: 180px;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
        background: var(--input);
        color: var(--inputText);
        outline: none;
      }
      button {
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
        background: var(--accent);
        color: var(--accentText);
        font-weight: 700;
        cursor: pointer;
      }
      button:hover { background: var(--accentHover); }
      button.secondary { background: transparent; color: var(--text); }
      button.secondary:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
      .composerRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
      .hint { font-size: 12px; color: var(--muted); }
    `;

    const script = `
      const vscode = acquireVsCodeApi();
      const chat = document.getElementById('chat');
      const input = document.getElementById('input');
      const sendBtn = document.getElementById('send');
      const titleSub = document.getElementById('titleSub');
      const refreshBtn = document.getElementById('refresh');
      const syncBtn = document.getElementById('sync');
      const newBranchBtn = document.getElementById('newBranch');
      const checkoutBtn = document.getElementById('checkout');
      const settingsBtn = document.getElementById('settings');

      const state = vscode.getState() || { messages: [] };

      function escapeHtml(s) {
        return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      }

      function render() {
        chat.innerHTML = '';
        for (const m of state.messages) {
          const wrap = document.createElement('div');
          wrap.className = 'msg ' + m.kind;
          const bubble = document.createElement('div');
          bubble.className = 'bubble';
          bubble.innerHTML = \`
            <div class="meta">
              <div class="who">\${escapeHtml(m.who)}</div>
              <div class="who">\${escapeHtml(m.time || '')}</div>
            </div>
            <div class="text"></div>
          \`;
          bubble.querySelector('.text').textContent = m.text || '';
          if (m.actions && m.actions.length) {
            const at = document.createElement('div');
            at.className = 'actionsTaken';
            at.textContent = 'Actions: ' + m.actions.join(', ');
            bubble.appendChild(at);
          }
          wrap.appendChild(bubble);
          chat.appendChild(wrap);
        }
        chat.scrollTop = chat.scrollHeight;
        vscode.setState(state);
      }

      function addMsg(kind, who, text, actions) {
        state.messages.push({
          kind,
          who,
          text,
          actions: actions || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        render();
      }

      async function send(text) {
        const msg = (text ?? '').trim();
        if (!msg) return;
        addMsg('user', 'You', msg);
        vscode.postMessage({ type: 'sendMessage', message: msg });
      }

      function quick(action) { vscode.postMessage({ type: 'quickAction', action }); }

      sendBtn.addEventListener('click', () => { send(input.value); input.value = ''; });
      refreshBtn.addEventListener('click', () => quick('status'));
      syncBtn.addEventListener('click', () => quick('sync'));
      newBranchBtn.addEventListener('click', () => quick('newBranch'));
      checkoutBtn.addEventListener('click', () => quick('checkout'));
      settingsBtn.addEventListener('click', () => quick('openSettings'));

      input.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          send(input.value);
          input.value = '';
        }
      });

      window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'status') {
          const s = msg.status;
          if (!s) return;
          if (!s.is_repo) {
            titleSub.textContent = 'Not a Git repository (open a git folder)';
            return;
          }
          const changed = Array.isArray(s.changed_files) ? s.changed_files.length : 0;
          const branch = s.branch || '(no branch)';
          titleSub.textContent = \`\${branch} • \${changed} changed\` + (s.remote_url ? ' • remote set' : ' • no remote');
        } else if (msg.type === 'chatResponse') {
          addMsg('ai', 'AI', msg.raw?.response ?? '', msg.raw?.actions_taken ?? []);
        } else if (msg.type === 'error') {
          addMsg('err', 'Error', msg.message ?? 'Unknown error');
        }
      });

      if (!state.messages?.length) {
        addMsg('ai', 'Git AI Agent', 'Try: "status", "upload my code", "create branch feature-x", "checkout main".\\nCtrl+Enter sends.');
      } else {
        render();
      }
      vscode.postMessage({ type: 'ready' });
    `;

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="Content-Security-Policy"
            content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Git AI Agent</title>
          <style>${style}</style>
        </head>
        <body>
          <div class="card">
            <div class="titleRow">
              <div>
                <div class="title">Git AI Agent</div>
                <div id="titleSub" class="subtle">Starting…</div>
              </div>
            </div>
            <div class="btnRow">
              <button id="refresh" class="secondary" title="Ask: status">Status</button>
              <button id="newBranch" class="secondary" title="Create a new branch">New branch</button>
              <button id="checkout" class="secondary" title="Checkout branch">Checkout</button>
              <button id="settings" class="secondary" title="Open settings">Settings</button>
              <button id="sync" title="Stage, commit, pull, push">Sync</button>
            </div>
          </div>
          <div id="chat" class="chat"></div>
          <div class="composer">
            <textarea id="input" placeholder='Message the agent… (Ctrl+Enter to send)'></textarea>
            <div class="composerRow">
              <div class="hint">Tip: Use “Sync” for upload/push flow. If it asks for remote URL, paste it here.</div>
              <button id="send">Send</button>
            </div>
          </div>
          <script nonce="${nonce}">${script}</script>
        </body>
      </html>`;
  }
}

