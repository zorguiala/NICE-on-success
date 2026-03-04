import * as vscode from "vscode";
import { playSuccessSound, playFailureSound } from "../sound_player/sound_selector";

export function registerManualSoundCommands(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): void {
    const playSuccessCommand = vscode.commands.registerCommand("niceOnSuccess.playSuccess", () => {
        outputChannel.appendLine("🎵 Manual success sound triggered");
        playSuccessSound(context);
    });

    const playFailureCommand = vscode.commands.registerCommand("niceOnSuccess.playFailure", () => {
        outputChannel.appendLine("🎵 Manual failure sound triggered");
        playFailureSound(context);
    });

    context.subscriptions.push(playSuccessCommand, playFailureCommand);
}
