# Git Stash

Add extra git stash powers to VS Code.

## Features

 - Configurable explorer tree
 - More stash commands

This plugin list all stashed entries in a tree view* along with their modified files.
Clicking on a file will display a diff view with the changes on that file, bringing an easy way to review or pickup stashed code.

![GitStash preview](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/screencast.gif)

* The tree view will be only shown on git tracked projects.


## Commands

|Command                   | Description
|--------------------------|------------
| Stash Apply...           | Applies a stash.
| Stash Drop...            | Drops a stash.
| Stash Clear              | Removes all the stash entries.


## Extension Settings

|Name                         | Description
|-----------------------------|------------
| `gitstash.explorer.enabled` | Enables or disables the stash explorer tree.
| `gitstash.entryFormat`      | Specifies the format for each stash entry. Available tokens: `${branch}` - the branch where the stash was created, `${description}` - the custom or default description for the stash entry, `${date}` - the stash creation date, `${index}` the stash index
| `gitstash.fileFormat`       | Specifies the format for each stashed file. Available tokens: `${filename}` - the file name, `${filepath}` - the file path, `${index}` the file index
| `gitstash.diffTitleFormat`  | Specifies the format for the diff document title. Available tokens: `${filename}` - the file name, `${filepath}` - the file path, `${fileIndex}` - the file index, `${date}` - the entry date, `${description}` - the entry description, `${branch}` - the entry branch, `${stashIndex}` - the entry index
| `gitstash.dateFormat`       | Specifies the date format for each stash entry. Available formats: `default`, `iso`, `local`, `raw`, `relative`, `rfc`, `short`
