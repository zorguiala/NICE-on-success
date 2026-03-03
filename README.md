# NICE on Success

Plays a configured sound when a task or build finishes successfully, and a separate configured sound when it fails.

## How to Use

### Option 1: Run Tests via the Task System (Recommended)

1. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
2. Select from the available tasks:
   - **Run Jest Tests** - Execute all tests
   - **Run Tests (watch mode)** - Run tests in watch mode
   - **Run Tests (specific file)** - Test the currently active file
3. The extension will play a sound when the task completes

### Option 2: Type Commands Directly in Terminal

To detect commands typed directly in the terminal, you need to enable **VS Code Shell Integration**:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: **"Shell: Install Shell Integration"**
3. Close and reopen your terminal
4. The extension will now detect all terminal command completions

Without shell integration, typed commands will not trigger sounds—only tasks will.

## Features

- **Success Sound:** Configure any custom `.wav` file to play upon a successful build or test execution.
- **Failure Sound:** Configure any custom `.wav` file to play when a build or test execution fails.

## Setup

In your VS Code `settings.json`, set the absolute path to your `.wav` files:

```json
{
  "niceOnSuccess.successSoundPath": "C:\\path\\to\\success.wav",
  "niceOnSuccess.failureSoundPath": "C:\\path\\to\\failure.wav"
}
```

Enjoy your sound effects!
