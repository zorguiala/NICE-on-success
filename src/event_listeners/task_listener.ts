import * as vscode from "vscode";
import { getEnabledCommands } from "../state_management/command_filter";
import { playSuccessSound, playFailureSound } from "../sound_player/sound_selector";

const taskStartTimes = new Map<string, number>();

export function registerTaskListener(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): void {
    const startDisposable = vscode.tasks.onDidStartTaskProcess((event) => {
        taskStartTimes.set(event.execution.task.name, Date.now());
    });

    const endDisposable = vscode.tasks.onDidEndTaskProcess((event) => {
        const taskName = event.execution.task.name;
        outputChannel.appendLine(`📋 Task "${taskName}" completed with exit code: ${event.exitCode}`);

        const config = vscode.workspace.getConfiguration("niceOnSuccess");
        const minDurationMs = config.get<number>("minDurationMs", 100);

        const startTime = taskStartTimes.get(taskName);
        if (startTime) {
            const duration = Date.now() - startTime;
            taskStartTimes.delete(taskName);

            if (duration < minDurationMs) {
                outputChannel.appendLine(`⏭️ Skipping sound - task took ${duration}ms (less than ${minDurationMs}ms)`);
                return;
            }
        }

        const enabledCommands = getEnabledCommands(context);

        if (enabledCommands.length > 0 && !enabledCommands.includes(taskName)) {
            outputChannel.appendLine(`⏭️ Skipping sound - "${taskName}" not in enabled list`);
            return;
        }

        const vscodeTaskExitCode = event.exitCode;
        const isSuccess = vscodeTaskExitCode === 0;

        if (isSuccess) {
            outputChannel.appendLine("✨ Task succeeded - playing success sound");
            playSuccessSound(context);
            return;
        }

        outputChannel.appendLine("❌ Task failed - playing failure sound");
        playFailureSound(context);
    });

    context.subscriptions.push(startDisposable, endDisposable);
}
