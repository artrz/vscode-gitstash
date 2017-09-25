# Git Stash

Add extra git stash powers to your editor.

## Features

This plugin list all stashed entries in a tree view* along with their modified files.
Clicking on a file will display a diff view with the changes on that file, bringing an easy way to review or pickup stashed code.

![GitStash preview](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/screencast.gif)

* The tree view will be only shown on git tracked projects.

## Extension Settings

|Name | Description
|-----|------------
| `gitstash.explorer.enabled` | Enables or disables the stash explorer tree.
| `gitstash.entryFormat`      | Specifies the format for each stash entry. Available tokens: `${branch}` - the branch where the stash was created, `${description}` - the custom or default description for the stash entry, `${date}` - the stash creation date, `${index}` the stash index
| `gitstash.fileFormat`       | Specifies the format for each stashed file. Available tokens: `${filename}` - the filename, `${filepath}` - the file path, `${index}` the file index
| `gitstash.dateFormat`       | Specifies the date format for each stash entry. Available formats: `default`, `iso`, `local`, `raw`, `relative`, `rfc`, `short`


Tip: Set a git stash / stash pop key bindings adding to your keybindings.json the following:

```json
[
    {
        "key": "ctrl+g ctrl+s",
        "command": "git.stash"
    },
    {
        "key": "ctrl+g ctrl+p",
        "command": "git.stashPopLatest"
    }
]
```
