import * as vscode from "vscode";
import { ChatViewProvider } from "./views/chatViewProvider";
import { BackendManager } from "./backend/backendManager";

let backendManager: BackendManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
  backendManager = new BackendManager(context);

  const chatProvider = new ChatViewProvider(context, backendManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("git-ai-agent.openChat", async () => {
      await vscode.commands.executeCommand("workbench.view.extension.gitAiAgent");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("git-ai-agent.startBackend", async () => {
      await backendManager?.ensureStarted({ forceRestart: true });
      vscode.window.showInformationMessage("Git AI Agent backend started.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("git-ai-agent.showRepoStatus", async () => {
      await backendManager?.ensureStarted({});
      const status = await backendManager?.getStatus();
      if (!status) return;

      if (!status.is_repo) {
        vscode.window.showWarningMessage(`Not a git repo: ${status.repo_path}`);
        return;
      }

      const changedCount = Array.isArray(status.changed_files) ? status.changed_files.length : 0;
      vscode.window.showInformationMessage(
        `Repo: ${status.repo_path} | Branch: ${status.branch ?? "?"} | Changed files: ${changedCount}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("git-ai-agent.syncPush", async () => {
      await backendManager?.ensureStarted({});
      const res = await backendManager?.chat("upload my code");
      vscode.window.showInformationMessage(res?.response ?? "No response from backend.");
    })
  );

  const cfg = vscode.workspace.getConfiguration("gitAiAgent.backend");
  const autoStart = cfg.get<boolean>("autoStart", true);
  if (autoStart && vscode.workspace.workspaceFolders?.length) {
    backendManager.ensureStarted({}).catch(() => {
      // Non-fatal: user can start manually.
    });
  }
}

export async function deactivate() {
  await backendManager?.stop();
}

