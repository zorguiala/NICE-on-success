import * as vscode from "vscode";
import { registerTaskListener } from "./event_listeners/task_listener";
import { registerTerminalListener } from "./event_listeners/terminal_listener";
import { registerManualSoundCommands } from "./manual_commands/sound_triggers";
import { addCommandToFilter, removeCommandFromFilter, listEnabledCommands, getEnabledCommands } from "./state_management/command_filter";

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel("NICE on Success");

    try {
        outputChannel.appendLine("✅ NICE on Success extension activated");
        vscode.window.showInformationMessage("NICE on Success: Extension activated");

        const enabledCommands = getEnabledCommands(context);
        outputChannel.appendLine(`📋 Enabled commands: ${enabledCommands.length === 0 ? "(empty - all enabled)" : JSON.stringify(enabledCommands)}`);

        registerTaskListener(context, outputChannel);

        registerTerminalListener(context, outputChannel);
        registerManualSoundCommands(context, outputChannel);

        const addCommandHandler = vscode.commands.registerCommand("niceOnSuccess.addCommand", () => addCommandToFilter(context, outputChannel));
        const removeCommandHandler = vscode.commands.registerCommand("niceOnSuccess.removeCommand", () => removeCommandFromFilter(context, outputChannel));
        const listCommandsHandler = vscode.commands.registerCommand("niceOnSuccess.listCommands", () => listEnabledCommands(context, outputChannel));

        context.subscriptions.push(addCommandHandler, removeCommandHandler, listCommandsHandler, outputChannel);
    } catch (error) {
        vscode.window.showErrorMessage(`NICE on Success activation error: ${error}`);
    }
}

export function deactivate() { }
