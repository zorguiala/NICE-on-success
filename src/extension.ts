import * as vscode from "vscode";
import * as childProcess from "child_process";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("NICE on Success");

  try {
    outputChannel.appendLine("✅ NICE on Success extension activated");
    vscode.window.showInformationMessage(
      "NICE on Success: Extension activated",
    );

    // Listen to task execution
    const onDidEndTaskProcessDisposable = vscode.tasks.onDidEndTaskProcess(
      (event) => {
        const taskName = event.execution.task.name;
        outputChannel.appendLine(
          `📋 Task "${taskName}" completed with exit code: ${event.exitCode}`,
        );

        // Check if user wants to filter tasks
        const config = vscode.workspace.getConfiguration("niceOnSuccess");
        const enabledTasks = config.get<string[]>("enabledTasks");

        outputChannel.appendLine(`🔍 Task name detected: "${taskName}"`);
        if (enabledTasks && enabledTasks.length > 0) {
          outputChannel.appendLine(
            `📝 Enabled tasks filter: ${JSON.stringify(enabledTasks)}`,
          );
        } else {
          outputChannel.appendLine(
            `📝 Enabled tasks filter: (empty - all tasks enabled)`,
          );
        }

        // If a filter is set and this task isn't in it, skip sound
        if (
          enabledTasks &&
          enabledTasks.length > 0 &&
          !enabledTasks.includes(taskName)
        ) {
          outputChannel.appendLine(
            `⏭️ Skipping sound - "${taskName}" not in filter`,
          );
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
      },
    );

    // Try to listen to terminal shell execution (disabled by default)
    try {
      const config = vscode.workspace.getConfiguration("niceOnSuccess");
      const enableTerminalListener = config.get<boolean>(
        "enableTerminalListener",
      );
      const enabledCommands =
        config.get<string[]>("enabledTerminalCommands") || [];

      const hasTerminalAPI = (vscode.window as any)
        .onDidEndTerminalShellExecution;

      if (hasTerminalAPI && enableTerminalListener) {
        outputChannel.appendLine(
          "🎺 Terminal shell execution API available - ENABLED!",
        );
        vscode.window.showInformationMessage(
          "NICE on Success: Terminal API enabled",
        );

        const onDidEndTerminalShellExecution = hasTerminalAPI((event: any) => {
          const commandLine = event.commandLine || "unknown";
          outputChannel.appendLine(
            `🖥️ Terminal command "${commandLine}" completed with exit code: ${event.exitCode}`,
          );

          // Check if user wants to filter terminal commands
          if (enabledCommands && enabledCommands.length > 0) {
            const matchesFilter = enabledCommands.some((cmd) =>
              commandLine.toLowerCase().includes(cmd.toLowerCase()),
            );
            if (!matchesFilter) {
              outputChannel.appendLine(
                `⏭️ Skipping sound - "${commandLine}" not in filter`,
              );
              return;
            }
          }

          if (event.exitCode !== undefined) {
            const isSuccess = event.exitCode === 0;

            if (isSuccess) {
              outputChannel.appendLine(
                "✨ Command succeeded - playing success sound",
              );
              playSuccessSound(context);
              return;
            }

            outputChannel.appendLine(
              "❌ Command failed - playing failure sound",
            );
            playFailureSound(context);
          }
        });

        context.subscriptions.push(onDidEndTerminalShellExecution);
      } else if (!hasTerminalAPI && enableTerminalListener) {
        // Only warn if user explicitly enabled it but API not available
        outputChannel.appendLine(
          "❌ Terminal shell execution API NOT available (requires VS Code 1.89.0+)",
        );
        vscode.window.showWarningMessage(
          "NICE on Success: Terminal API not available. Update VS Code to 1.89.0+",
        );
      } else {
        outputChannel.appendLine(
          "ℹ️ Terminal listener disabled (enable with niceOnSuccess.enableTerminalListener setting)",
        );
      }
    } catch (error) {
      outputChannel.appendLine(`⚠️ Error checking terminal API: ${error}`);
    }

    context.subscriptions.push(onDidEndTaskProcessDisposable);

    // Register manual test commands
    const playSuccessCommand = vscode.commands.registerCommand(
      "niceOnSuccess.playSuccess",
      () => {
        outputChannel.appendLine("🎵 Manual success sound triggered");
        playSuccessSound(context);
      },
    );

    const playFailureCommand = vscode.commands.registerCommand(
      "niceOnSuccess.playFailure",
      () => {
        outputChannel.appendLine("🎵 Manual failure sound triggered");
        playFailureSound(context);
      },
    );

    context.subscriptions.push(
      playSuccessCommand,
      playFailureCommand,
      outputChannel,
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `NICE on Success activation error: ${error}`,
    );
  }
}

function playSuccessSound(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("niceOnSuccess");
  const customSoundPath = config.get<string>("successSoundPath");

  if (customSoundPath) {
    playSoundFile(customSoundPath);
    return;
  }

  const successFolder = path.join(context.extensionPath, "sounds", "success");
  playRandomSoundFromFolder(successFolder);
}

function playFailureSound(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("niceOnSuccess");
  const customSoundPath = config.get<string>("failureSoundPath");

  if (customSoundPath) {
    playSoundFile(customSoundPath);
    return;
  }

  const failsFolder = path.join(context.extensionPath, "sounds", "fails");
  playRandomSoundFromFolder(failsFolder);
}

function playRandomSoundFromFolder(folderPath: string) {
  try {
    const files = fs.readdirSync(folderPath);
    const audioFiles = files.filter(
      (file) =>
        file.endsWith(".wav") ||
        file.endsWith(".mp3") ||
        file.endsWith(".flac") ||
        file.endsWith(".aac"),
    );

    if (audioFiles.length === 0) {
      vscode.window.showErrorMessage(`No audio files found in ${folderPath}`);
      return;
    }

    const randomFile =
      audioFiles[Math.floor(Math.random() * audioFiles.length)];
    const fullPath = path.join(folderPath, randomFile);
    playSoundFile(fullPath);
  } catch (error) {
    vscode.window.showErrorMessage(`Error reading sounds folder: ${error}`);
  }
}

function playSoundFile(absoluteFilePath: string) {
  const osPlatform = process.platform;

  try {
    if (osPlatform === "win32") {
      childProcess.exec(
        `powershell -c (New-Object Media.SoundPlayer '${absoluteFilePath}').PlaySync();`,
        (error) => {
          if (error) {
            vscode.window.showErrorMessage(
              `Sound playback error: ${error.message}`,
            );
          }
        },
      );
      return;
    }

    if (osPlatform === "darwin") {
      childProcess.exec(`afplay "${absoluteFilePath}"`, (error) => {
        if (error) {
          vscode.window.showErrorMessage(
            `Sound playback error: ${error.message}`,
          );
        }
      });
      return;
    }

    if (osPlatform === "linux") {
      childProcess.exec(`aplay "${absoluteFilePath}"`, (error) => {
        if (error) {
          vscode.window.showErrorMessage(
            `Sound playback error: ${error.message}`,
          );
        }
      });
      return;
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to play sound: ${error}`);
  }
}

export function deactivate() {}
