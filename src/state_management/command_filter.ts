import * as vscode from "vscode";

export const ENABLED_COMMANDS_KEY = "nice-on-success.enabledCommands";

export function getEnabledCommands(context: vscode.ExtensionContext): string[] {
    return (context.globalState.get<string[]>(ENABLED_COMMANDS_KEY) || []) as string[];
}

export async function addCommandToFilter(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
    const commandName = await vscode.window.showInputBox({
        prompt: "Enter command name",
        placeHolder: "npm: test",
    });

    if (!commandName) {
        return;
    }

    const currentCommands = getEnabledCommands(context);

    if (currentCommands.includes(commandName)) {
        vscode.window.showWarningMessage(`"${commandName}" is already in the filter`);
        outputChannel.appendLine(`⚠️ Command "${commandName}" already exists`);
        return;
    }

    currentCommands.push(commandName);
    await context.globalState.update(ENABLED_COMMANDS_KEY, currentCommands);

    vscode.window.showInformationMessage(`✅ Added "${commandName}" to the filter`);
    outputChannel.appendLine(`✅ Added "${commandName}" | Enabled commands: ${JSON.stringify(currentCommands)}`);
}

export async function removeCommandFromFilter(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
    const currentCommands = getEnabledCommands(context);

    if (currentCommands.length === 0) {
        vscode.window.showWarningMessage("No commands in the filter");
        return;
    }

    const selected = await vscode.window.showQuickPick(currentCommands, {
        placeHolder: "Select a command to remove",
    });

    if (!selected) {
        return;
    }

    const updated = currentCommands.filter((cmd) => cmd !== selected);
    await context.globalState.update(ENABLED_COMMANDS_KEY, updated);

    vscode.window.showInformationMessage(`✅ Removed "${selected}" from the filter`);
    outputChannel.appendLine(`✅ Removed "${selected}" | Enabled commands: ${JSON.stringify(updated)}`);
}

export async function listEnabledCommands(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
    const currentCommands = getEnabledCommands(context);

    if (currentCommands.length === 0) {
        vscode.window.showInformationMessage("No enabled commands (all commands/tasks will trigger sounds)");
    } else {
        vscode.window.showInformationMessage(`Enabled commands: ${currentCommands.join(", ")}`);
    }

    outputChannel.appendLine(`📋 Current enabled commands: ${currentCommands.length === 0 ? "(empty)" : JSON.stringify(currentCommands)}`);
}
