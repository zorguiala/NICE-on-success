import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { playSoundAbsoluteFilePath } from "./audio_player";

export function playSuccessSound(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration("niceOnSuccess");
    const customSoundPath = config.get<string>("successSoundPath");

    if (customSoundPath) {
        playSoundAbsoluteFilePath(customSoundPath);
        return;
    }

    const successFolder = path.join(context.extensionPath, "sounds", "success");
    playRandomSoundFromFolder(successFolder);
}

export function playFailureSound(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration("niceOnSuccess");
    const customSoundPath = config.get<string>("failureSoundPath");

    if (customSoundPath) {
        playSoundAbsoluteFilePath(customSoundPath);
        return;
    }

    const failsFolder = path.join(context.extensionPath, "sounds", "fails");
    playRandomSoundFromFolder(failsFolder);
}

function playRandomSoundFromFolder(folderPath: string): void {
    try {
        const files = fs.readdirSync(folderPath);
        const audioFiles = files.filter(
            (file) => file.endsWith(".wav") || file.endsWith(".mp3")
        );

        if (audioFiles.length === 0) {
            vscode.window.showErrorMessage(`No audio files found in ${folderPath}`);
            return;
        }

        const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        const fullPath = path.join(folderPath, randomFile);
        playSoundAbsoluteFilePath(fullPath);
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading sounds folder: ${error}`);
    }
}
