import * as vscode from "vscode";
import * as childProcess from "child_process";
import * as path from "path";
import * as fs from "fs";

const ENABLED_COMMANDS_KEY = "nice-on-success.enabledCommands";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("NICE on Success");

  try {
    outputChannel.appendLine("✅ NICE on Success extension activated");
    vscode.window.showInformationMessage(
      "NICE on Success: Extension activated",
    );

    // Initialize global state for enabled commands
    const enabledCommands = (context.globalState.get<string[]>(
      ENABLED_COMMANDS_KEY,
    ) || []) as string[];
    outputChannel.appendLine(
      `📋 Enabled commands: ${enabledCommands.length === 0 ? "(empty - all commands/tasks enabled)" : JSON.stringify(enabledCommands)}`,
    );

    // Listen to task execution
    const onDidEndTaskProcessDisposable = vscode.tasks.onDidEndTaskProcess(
      (event) => {
        const taskName = event.execution.task.name;
        outputChannel.appendLine(
          `📋 Task "${taskName}" completed with exit code: ${event.exitCode}`,
        );

        // Check if user has set up a filter
        if (enabledCommands.length > 0 && !enabledCommands.includes(taskName)) {
          outputChannel.appendLine(
            `⏭️ Skipping sound - "${taskName}" not in enabled list`,
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

    // Try to listen to terminal shell execution
    try {
      const config = vscode.workspace.getConfiguration("niceOnSuccess");
      const enableTerminalListener = config.get<boolean>(
        "enableTerminalListener",
      );

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

          // Check if user has set up a filter
          if (enabledCommands.length > 0) {
            const matchesFilter = enabledCommands.some((cmd) =>
              commandLine.toLowerCase().includes(cmd.toLowerCase()),
            );
            if (!matchesFilter) {
              outputChannel.appendLine(
                `⏭️ Skipping sound - "${commandLine}" not in enabled list`,
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

    // Register commands
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

    const addCommandHandler = vscode.commands.registerCommand(
      "niceOnSuccess.addCommand",
      async () => {
        const commandName = await vscode.window.showInputBox({
          prompt: 'Enter command name (e.g., "npm: test", "npm: build")',
          placeHolder: "npm: test",
        });

        if (!commandName) {
          return;
        }

        const currentCommands = (context.globalState.get<string[]>(
          ENABLED_COMMANDS_KEY,
        ) || []) as string[];

        if (currentCommands.includes(commandName)) {
          vscode.window.showWarningMessage(
            `"${commandName}" is already in the filter`,
          );
          outputChannel.appendLine(
            `⚠️ Command "${commandName}" already exists`,
          );
          return;
        }

        currentCommands.push(commandName);
        await context.globalState.update(ENABLED_COMMANDS_KEY, currentCommands);

        vscode.window.showInformationMessage(
          `✅ Added "${commandName}" to the filter`,
        );
        outputChannel.appendLine(
          `✅ Added "${commandName}" | Enabled commands: ${JSON.stringify(currentCommands)}`,
        );
      },
    );

    const removeCommandHandler = vscode.commands.registerCommand(
      "niceOnSuccess.removeCommand",
      async () => {
        const currentCommands = (context.globalState.get<string[]>(
          ENABLED_COMMANDS_KEY,
        ) || []) as string[];

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

        vscode.window.showInformationMessage(
          `✅ Removed "${selected}" from the filter`,
        );
        outputChannel.appendLine(
          `✅ Removed "${selected}" | Enabled commands: ${JSON.stringify(updated)}`,
        );
      },
    );

    const listCommandsHandler = vscode.commands.registerCommand(
      "niceOnSuccess.listCommands",
      async () => {
        const currentCommands = (context.globalState.get<string[]>(
          ENABLED_COMMANDS_KEY,
        ) || []) as string[];

        if (currentCommands.length === 0) {
          vscode.window.showInformationMessage(
            "No enabled commands (all commands/tasks will trigger sounds)",
          );
        } else {
          vscode.window.showInformationMessage(
            `Enabled commands: ${currentCommands.join(", ")}`,
          );
        }

        outputChannel.appendLine(
          `📋 Current enabled commands: ${currentCommands.length === 0 ? "(empty - all enabled)" : JSON.stringify(currentCommands)}`,
        );
      },
    );

    context.subscriptions.push(
      playSuccessCommand,
      playFailureCommand,
      addCommandHandler,
      removeCommandHandler,
      listCommandsHandler,
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
    const audioFiles = files.filter((file) => file.endsWith(".wav"));

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
      // Extract the file extension
      const fileExtension = path.extname(absoluteFilePath).toLowerCase();

      // Escape single quotes for PowerShell
      const escapedPath = absoluteFilePath.replace(/'/g, "''");

      // Only WAV files can use SoundPlayer, everything else uses WMPlayer
      if (fileExtension === ".wav") {
        childProcess.exec(
          `powershell -c (New-Object Media.SoundPlayer '${escapedPath}').PlaySync();`,
          (error) => {
            if (error) {
              vscode.window.showErrorMessage(
                `Sound playback error: ${error.message}`,
              );
            }
          },
        );
      } else if (
        fileExtension === ".mp3" ||
        fileExtension === ".flac" ||
        fileExtension === ".aac"
      ) {
        // Use Windows Media Player for compressed formats
        childProcess.exec(
          `powershell -c "$player = New-Object -ComObject WMPlayer.OCX; $player.URL = '${escapedPath}'; while($player.playState -eq 0 -or $player.playState -eq 3){Start-Sleep -m 100}; $player.controls.stop();"`,
          (error) => {
            if (error) {
              vscode.window.showErrorMessage(
                `Sound playback error: ${error.message}`,
              );
            }
          },
        );
      } else {
        vscode.window.showErrorMessage(
          `Unsupported audio format: ${fileExtension}. Supported: .wav, .mp3, .flac, .aac`,
        );
      }
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
