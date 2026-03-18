import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";

export type ChatResponse = {
  response: string;
  actions_taken?: string[];
  require_user_input?: boolean;
  context?: Record<string, unknown>;
};

export type RepoStatus = {
  is_repo: boolean;
  repo_path: string;
  branch?: string | null;
  changed_files?: Array<{ state: string; path: string }>;
  remote_url?: string | null;
};

type EnsureStartedOpts = { forceRestart?: boolean };

export class BackendManager {
  private proc: cp.ChildProcess | undefined;
  private outputChannel: vscode.OutputChannel;
  private starting: Promise<void> | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel("Git AI Agent");
  }

  private getPort(): number {
    const cfg = vscode.workspace.getConfiguration("gitAiAgent.backend");
    return cfg.get<number>("port", 8000);
  }

  private getPythonPath(): string {
    const cfg = vscode.workspace.getConfiguration("gitAiAgent.backend");
    return cfg.get<string>("pythonPath", "python");
  }

  private getWorkspaceCwd(): string {
    const wf = vscode.workspace.workspaceFolders?.[0];
    return wf ? wf.uri.fsPath : process.cwd();
  }

  private baseUrl(): string {
    return `http://127.0.0.1:${this.getPort()}`;
  }

  async ensureStarted(opts: EnsureStartedOpts): Promise<void> {
    if (opts.forceRestart) {
      await this.stop();
    }

    if (this.proc && !this.proc.killed) return;
    if (this.starting) return this.starting;

    this.starting = (async () => {
      const cwd = this.getWorkspaceCwd();
      const python = this.getPythonPath();
      const port = String(this.getPort());

      // Run uvicorn from repo root so GitEngine(repo_path=".") points at the workspace.
      const args = ["-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", port];
      this.outputChannel.appendLine(`[backend] starting: ${python} ${args.join(" ")}`);
      this.outputChannel.appendLine(`[backend] cwd: ${cwd}`);
      this.outputChannel.show(true);

      this.proc = cp.spawn(python, args, { cwd, windowsHide: true });

      this.proc.stdout?.on("data", (d) => this.outputChannel.appendLine(String(d).trimEnd()));
      this.proc.stderr?.on("data", (d) => this.outputChannel.appendLine(String(d).trimEnd()));
      this.proc.on("exit", (code) => {
        this.outputChannel.appendLine(`[backend] exited with code ${code}`);
        this.proc = undefined;
      });

      await this.waitForHealthy(15_000);
    })().finally(() => {
      this.starting = undefined;
    });

    return this.starting;
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    const p = this.proc;
    this.proc = undefined;

    try {
      p.kill();
    } catch {
      // ignore
    }
  }

  private async waitForHealthy(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastErr: unknown = undefined;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${this.baseUrl()}/`);
        if (res.ok) return;
      } catch (e) {
        lastErr = e;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    throw new Error(
      `Backend did not become healthy in time. Last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`
    );
  }

  async chat(message: string, context?: Record<string, unknown>): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl()}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, context: context ?? null }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Chat failed (${res.status}): ${txt}`);
    }
    return (await res.json()) as ChatResponse;
  }

  async getStatus(): Promise<RepoStatus> {
    const res = await fetch(`${this.baseUrl()}/api/status`);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Status failed (${res.status}): ${txt}`);
    }
    return (await res.json()) as RepoStatus;
  }
}

