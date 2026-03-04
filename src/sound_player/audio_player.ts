import * as childProcess from "child_process";
import * as path from "path";
import * as vscode from "vscode";

export function playSoundAbsoluteFilePath(absoluteFilePath: string): void {
    const osPlatform = process.platform;
    try {
        if (osPlatform === "win32") {
            playWindowsSound(absoluteFilePath);
            return;
        }
        if (osPlatform === "darwin") {
            playMacSound(absoluteFilePath);
            return;
        }
        if (osPlatform === "linux") {
            playLinuxSound(absoluteFilePath);
            return;
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to play sound: ${error}`);
    }
}

function playWindowsSound(absoluteFilePath: string): void {
    const fileExtension = path.extname(absoluteFilePath).toLowerCase();
    const escapedPath = absoluteFilePath.replace(/'/g, "''");

    if (fileExtension === ".wav") {
        childProcess.exec(
            `powershell -c (New-Object Media.SoundPlayer '${escapedPath}').PlaySync();`,
            showPlaybackErrorIfAny
        );
        return;
    }
    if (fileExtension === ".mp3" || fileExtension === ".flac" || fileExtension === ".aac") {
        childProcess.exec(
            `powershell -c "$player = New-Object -ComObject WMPlayer.OCX; $player.URL = '${escapedPath}'; while($player.playState -eq 0 -or $player.playState -eq 3){Start-Sleep -m 100}; $player.controls.stop();"`,
            showPlaybackErrorIfAny
        );
        return;
    }
    vscode.window.showErrorMessage(`Unsupported audio format: ${fileExtension}. Supported: .wav, .mp3, .flac, .aac`);
}

function playMacSound(absoluteFilePath: string): void {
    childProcess.exec(`afplay "${absoluteFilePath}"`, showPlaybackErrorIfAny);
}

function playLinuxSound(absoluteFilePath: string): void {
    childProcess.exec(`aplay "${absoluteFilePath}"`, showPlaybackErrorIfAny);
}

function showPlaybackErrorIfAny(error: childProcess.ExecException | null): void {
    if (error) {
        vscode.window.showErrorMessage(`Sound playback error: ${error.message}`);
    }
}
