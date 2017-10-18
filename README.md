# Git Stash

Add extra git stash powers to VS Code.

## Features

 - Configurable explorer tree
 - Practically all stash commands with most common options

This plugin list all stashed entries in a tree view* along with their modified files.
Clicking on a file will display a diff view with the changes on that file, bringing an easy way to review or pickup stashed code.

![GitStash preview](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/screencast.gif)

* The tree view will be only shown on git tracked projects.


## Commands

| Title                     | Command                   | Description
|---------------------------|---------------------------|------------
| Stash...                  | gitstash.stash            | Generate a stash with custom options. Use `stash only` to generate a simple stash. Use `Keep index` to stash but keep all changes added to the index intact (besides stashing them). Use `Include untracked` if you want to stash also untracked files, leaving the working directory in a very clean state. If you want to stash besides the untracked files, the ingored ones, use the `All` option instead.
| Stash Pop...              | gitstash.pop              | Pops a stash w/ or w/o file reindexing, If reindexing selected, every change added to index will be back to that state. this can fail, when you have conflicts (which are stored in the index, where you therefore can no longer apply the changes as they were originally).
| Stash Apply...            | gitstash.apply            | Applies a stash w/ or w/o file reindexing. Reindexing will work the same as Stash Pop with reindex.
| Stash Branch...           | gitstash.branch           | Creates and checks out a new branch starting from the commit at which the stash was originally created, applies the changes recorded in the selected stash to the new working tree and index. If that succeeds the stash will be dropped.
| Stash Drop...             | gitstash.drop             | Drops a stash.
| Stash Clear               | gitstash.clear            | Removes all the stash entries.
| Reload the stash explorer | gitstash.explorer.refresh | Reloads the stash explorer tree.
| Toggle the stash explorer | gitstash.explorer.toggle  | Shows/hides the stash explorer tree.


## Extension Settings

|Name                         | Default                                              | Description
|-----------------------------|------------------------------------------------------|------------
| `gitstash.explorer.enabled` | `true`                                               | Enables or disables the stash explorer tree on startup.
| `gitstash.explorer.buttons` | `true`                                               | Shows or hides the explorer buttons.
| `gitstash.entryFormat`      | `#${stashEntry.index}:   ${description} (${branch})` | Specifies the format for each stash entry. Available tokens: `${branch}` - the branch where the stash was created, `${description}` - the custom or default description for the stash entry, `${date}` - the stash creation date, `${index}` the stash index
| `gitstash.fileFormat`       | `${filename} (${filepath})`                          | Specifies the format for each stashed file. Available tokens: `${filename}` - the file name, `${filepath}` - the file path, `${index}` the file index
| `gitstash.diffTitleFormat`  | `#${index}: ${filename} (${branch})`                 | Specifies the format for the diff document title. Available tokens: `${filename}` - the file name, `${filepath}` - the file path, `${fileIndex}` - the file index, `${date}` - the entry date, `${description}` - the entry description, `${branch}` - the entry branch, `${stashIndex}` - the entry index
| `gitstash.dateFormat`       | `default`                                            | Specifies the date format for each stash entry. Available formats: `default`, `iso`, `local`, `raw`, `relative`, `rfc`, `short`
| `gitstash.log.autoclear`    | `false`                                              | Clears the log window before showing the action result.


## Tips

- Contrary to the git stash command included in VS Code, with `Stash... - Stash only` you can generate a stash even though all your changes are already added to index.
 - Use `Stash... - Keep index` if you want to make two or more commits out of the changes in the work tree and you want to isolate features to test each change before committing.
 - With `Git Stash` + `Stash Apply...` you can make a backup in case you want to make some cleanup for incomplete features before making a commit.
- You may want to control when to see the stash explorer, to do so add a key binding to execute `gitstash.explorer.toggle` and configure the extension to not to show the stash explorer tree when starting the editor with `gitstash.explorer.enabled`.
