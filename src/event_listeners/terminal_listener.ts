import * as vscode from "vscode";
import { getEnabledCommands } from "../state_management/command_filter";
import { playSuccessSound, playFailureSound } from "../sound_player/sound_selector";

const terminalStartTimes = new Map<string, number>();

export function registerTerminalListener(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): void {
    try {
        const config = vscode.workspace.getConfiguration("niceOnSuccess");
        const enableTerminalListener = config.get<boolean>("enableTerminalListener");

        const windowContext = vscode.window as any;
        const hasTerminalAPI = windowContext.onDidEndTerminalShellExecution;
        const hasStartAPI = windowContext.onDidStartTerminalShellExecution;

        if (hasTerminalAPI && enableTerminalListener) {
            outputChannel.appendLine("🎺 Terminal shell execution API available - ENABLED!");
            vscode.window.showInformationMessage("NICE on Success: Terminal API enabled");

            if (hasStartAPI) {
                const onDidStart = hasStartAPI((event: any) => {
                    const execution = event.execution || event;
                    const cmd = typeof execution.commandLine === 'string' ? execution.commandLine : (execution.commandLine?.value || "unknown");
                    terminalStartTimes.set(cmd, Date.now());
                });
                context.subscriptions.push(onDidStart);
            }

            const onDidEndTerminalShellExecution = hasTerminalAPI((event: any) => {
                handleTerminalExecution(event, context, outputChannel);
            });

            context.subscriptions.push(onDidEndTerminalShellExecution);
            return;
        }

        if (!hasTerminalAPI && enableTerminalListener) {
            outputChannel.appendLine("❌ Terminal shell execution API NOT available (requires VS Code 1.89.0+)");
            vscode.window.showWarningMessage("NICE on Success: Terminal API not available. Update VS Code to 1.89.0+");
            return;
        }

        outputChannel.appendLine("ℹ️ Terminal listener disabled (enable with niceOnSuccess.enableTerminalListener setting)");
    } catch (error) {
        outputChannel.appendLine(`Error checking terminal API: ${error}`);
    }
}

function handleTerminalExecution(event: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): void {
    const execution = event.execution || event;
    const commandLine = typeof execution.commandLine === 'string' ? execution.commandLine : (execution.commandLine?.value || execution.commandLine || "unknown");

    outputChannel.appendLine(`🖥️ Terminal command "${commandLine}" completed with exit code: ${event.exitCode}`);

    const config = vscode.workspace.getConfiguration("niceOnSuccess");
    const minDurationMs = config.get<number>("minDurationMs", 500);

    const startTime = terminalStartTimes.get(commandLine);
    if (startTime) {
        const duration = Date.now() - startTime;
        terminalStartTimes.delete(commandLine);

        if (duration < minDurationMs) {
            outputChannel.appendLine(`⏭️ Skipping sound - command took ${duration}ms (less than ${minDurationMs}ms)`);
            return;
        }
    }

    const enabledCommands = getEnabledCommands(context);

    if (enabledCommands.length > 0) {
        const matchesFilter = enabledCommands.some((cmd) =>
            commandLine.toLowerCase().includes(cmd.toLowerCase()),
        );
        if (!matchesFilter) {
            outputChannel.appendLine(`⏭️ Skipping sound - "${commandLine}" not in enabled list`);
            return;
        }
    }

    if (event.exitCode !== undefined) {
        const isSuccess = event.exitCode === 0;

        if (isSuccess) {
            outputChannel.appendLine("✨ Command succeeded - playing success sound");
            playSuccessSound(context);
            return;
        }

        outputChannel.appendLine("❌ Command failed - playing failure sound");
        playFailureSound(context);
    }
}
