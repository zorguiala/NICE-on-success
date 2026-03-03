# NICE on Success

🎵 **Install and it works instantly!** The extension automatically plays celebratory sounds when your tasks and commands succeed, and different sounds when they fail.

## Features

- ✅ **Auto-detect Task Success/Failure** - Plays sounds immediately when tasks complete
- 🔊 **Random Sound Selection** - Multiple sounds in success and failure folders, randomly selected each time
- 🎯 **Command Filtering** - Add or remove specific tasks/commands to control which ones trigger sounds
- 🎨 **Custom Sounds** - Replace default sounds with your own `.wav` files
- 🖥️ **Terminal Support** - Optional terminal command detection (requires VS Code 1.89.0+)

## Usage

**Just run your tasks normally!** When a task completes:

- ✨ Success (exit code 0) → Random success sound plays
- ❌ Failure (non-zero exit code) → Random failure sound plays

### Managing Sound Triggers

By default, all tasks trigger sounds. To filter specific tasks/commands:

1. Press `Ctrl+Shift+P` and search for:
   - **"NICE: Add Command to Filter"** - Add a specific task/command
   - **"NICE: Remove Command from Filter"** - Remove a task/command
   - **"NICE: Show Enabled Commands"** - View current filter list

### Custom Sounds

To use your own `.wav` files, edit your VS Code settings:

```json
{
  "niceOnSuccess.successSoundPath": "C:\\absolute\\path\\to\\success.wav",
  "niceOnSuccess.failureSoundPath": "C:\\absolute\\path\\to\\failure.wav"
}
```

### Terminal Commands (Optional)

To enable sounds for typed terminal commands:

1. Open VS Code Settings
2. Search for `niceOnSuccess.enableTerminalListener`
3. Enable it (requires VS Code 1.89.0+)

---

Enjoy your sounds! 🎉
