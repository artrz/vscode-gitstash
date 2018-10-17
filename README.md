# Git Stash

Add extra git stash powers to VS Code.

## Features

 - Configurable explorer tree
 - Practically all stash commands with most common options
 - Apply actions to stashed data from the tree view
    - Apply, pop, drop stashes
    - Diff stashed file changes or compare with current file state
    - Apply changes from single stashed file

This extension allows to comfortably create, apply, delete and inspect stashes. It results helpful when working on different features, switching to branches for modifications or creating sets of local experimental features.
Navigate on your stash entries, and run basically all stash commands visually and review the results.

![GitStash preview](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/screencast.gif)

![Tree actions](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/tree.png)

![Conflicts notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/success.png)

![Conflicts notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/conflicts.png)

![Conflicts notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/failure.png)

![Image diff](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/image-diff.png)


## Commands

| Title            | Command                   | Description
|------------------|---------------------------|------------
| Stash...         | gitstash.stash            | Generate a stash with custom options. Use `stash only` to generate a simple stash. Use `Keep index` to stash but keep all changes added to the index intact (besides stashing them). Use `Include untracked` if you want to stash also untracked files, leaving the working directory in a very clean state. If you want to stash besides the untracked files, the ignored ones, use the `All` option instead. **WARNING**: Using `Include untracked` (which applies the --include-untracked option) will clean/delete any ignored file, this is not a behavior implemented on the extension but the way some old git versions work.
| Pop...           | gitstash.pop              | Pops a stash w/ or w/o file reindexing, If reindexing selected, every change added to index will be back to that state. this can fail, when you have conflicts (which are stored in the index, where you therefore can no longer apply the changes as they were originally).
| Apply...         | gitstash.apply            | Applies a stash w/ or w/o file reindexing. Reindexing will work the same as Stash Pop with reindex.
| Branch...        | gitstash.branch           | Creates and checks out a new branch starting from the commit at which the stash was originally created, applies the changes recorded in the selected stash to the new working tree and index. If that succeeds the stash will be dropped.
| Drop...          | gitstash.drop             | Drops a stash.
| Clear            | gitstash.clear            | Removes all the stash entries.
| Refresh explorer | gitstash.explorer.refresh | Reloads the stash explorer tree.
| Toggle explorer  | gitstash.explorer.toggle  | Shows/hides the stash explorer tree.


## Extension Settings

|Name                           | Default                                              | Description
|-------------------------------|------------------------------------------------------|------------
| `gitstash.explorer.enabled`   | `true`                                               | Enables or disables the stash explorer tree on startup.
| `gitstash.explorer.buttons`   | `true`                                               | Shows or hides the explorer buttons.
| `gitstash.entryFormat`        | `#${stashEntry.index}:   ${description} (${branch})` | Specifies the format for each stash entry. Available tokens: `${branch}` - the branch where the stash was created, `${description}` - the custom or default description for the stash entry, `${date}` - the stash creation date, `${index}` the stash index
| `gitstash.entryTooltipFormat` | `#${stashEntry.index}:   ${description} (${branch})` | Specifies the format for each stash entry tooltip. Available tokens: Same than entryFormat
| `gitstash.fileFormat`         | `${filename} (${filepath})`                          | Specifies the format for each stashed file. Available tokens: `${filename}` - the file name, `${filepath}` - the file path, `${type}` - the change type
| `gitstash.fileTooltipFormat`  | `${filename} (${filepath})`                          | Specifies the format for each stashed file tooltip. Available tokens: Same than fileFormat
| `gitstash.diffTitleFormat`    | `#${stashIndex}: ${filename} (${filepath})`          | Specifies the format for the diff document title. Available tokens: `${filename}` - the file name, `${filepath}` - the file path, `${date}` - the entry date, `${description}` - the entry description, `${branch}` - the entry branch, `${stashIndex}` - the entry index
| `gitstash.dateFormat`         | `default`                                            | Specifies the date format for each stash entry. Available formats: `default`, `iso`, `local`, `raw`, `relative`, `rfc`, `short`
| `gitstash.log.autoclear`      | `false`                                              | Clears the log window before showing the action result.


## Tips

- Contrary to the git stash command included in VS Code, with `Stash... - Stash only` you can generate a stash even though all your changes are already added to index.
- Use `Stash... - Keep index` if you want to make two or more commits out of the changes in the work tree and you want to isolate features to test each change before committing.
- With `Git Stash` + `Stash Apply...` you can make a backup in case you want to make some cleanup for incomplete features before making a commit.
- You may want to control when to see the stash explorer, to do so add a key binding to execute `gitstash.explorer.toggle` and configure the extension to not to show the stash explorer tree when starting the editor with `gitstash.explorer.enabled`.
