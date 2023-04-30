# Git Stash

Seamlessly integration of git stash functionalities to your editor

## Features

This extension adds a rich set of commands and an interactive explorer tree where you can create, inspect, apply and delete stashes, so managing this data becomes a breeze. It also adds a context menu option on the files listed in the source control view to selectively stash them.
Every executed command is logged along its output for peace of mind.

### Stashes explorer
  - Apply, pop, branch, drop stashes (buttons / context menu)
  - Diff stashed file changes + [alternative diff modes](#diff-view-modes)
  - Apply changes from single stashed file
  - Copy to clipboard (context menu)
  - Configurable labels, descriptions, icons, tooltips, decorations, clipboard data
  - Configurable data loading strategy for files (performance related)

### Source control explorer
  - Stash selected files (context menu)

### Screenshots

![GitStash preview](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/screencast.gif)

![Tree actions](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/tree.png)

![Success notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/success.png)

![Conflicts notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/conflicts.png)

![Failure notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/failure.png)

![Image diff](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/image-diff.png)


## Diff view modes

### Stash changes ⟷ Current

This is the main diff mode where the stashed changes are compared to the current state of the file.

### Current ⟷ Stash changes

This diff view compares the current state of the file to the staged file, this helps to review how valuable may be the previous (staged) changes considering the latest updates.

### Stash source ⟷ Current

This mode compares the original state of the stashed file before being modified. Being able to compare the staged file before changing can be helpful when the current state of the file has changed in a way that the staged changes don't make much cense anymore.

### Current ⟷ Stash source

Alternative way to diff the stashed file without its changes.


## Commands

| Title            | Command                   | Description
|------------------|---------------------------|------------
| Stash...         | gitstash.stash            | Generate a stash with custom options. Use `stash only` to generate a simple stash. Use `Keep index` to stash but keep all changes added to the index intact (besides stashing them). Use `Include untracked` if you want to stash also untracked files, leaving the working directory in a very clean state. If you want to stash besides the untracked files, the ignored ones, use the `All` option instead. **WARNING**: Using `Include untracked` (which applies the --include-untracked option) will clean/delete any ignored file, this is not a behavior implemented on the extension but the way some old git versions work.
| Pop...           | gitstash.pop              | Pops a stash w/ or w/o file reindexing, If reindexing selected, every change added to index will be back to that state. this can fail, when you have conflicts (which are stored in the index, where you therefore can no longer apply the changes as they were originally).
| Apply...         | gitstash.apply            | Applies a stash w/ or w/o file reindexing. Reindexing will work the same as Stash Pop with reindex.
| Branch...        | gitstash.branch           | Creates and checks out a new branch starting from the commit at which the stash was originally created, applies the changes recorded in the selected stash to the new working tree and index. If that succeeds the stash will be dropped.
| Drop...          | gitstash.drop             | Drops a stash.
| Clear            | gitstash.clear            | Removes all the repository stashes.
| Refresh explorer | gitstash.explorer.refresh | Reloads the stash explorer tree.
| Toggle explorer  | gitstash.explorer.toggle  | Shows/hides the stash explorer tree.


## Extension Settings

| Name                                                      | Description |
|-----------------------------------------------------------|-------------|
| `gitstash.explorer.enabled`                               | Shows or hides the explorer on startup |
| `gitstash.explorer.buttons`                               | Shows or hides the explorer tree buttons |
| `gitstash.explorer.eagerLoadStashes`                      | If enabled, stashes will be preloaded instead of lazy loaded. This is required to see the stashes count but may degrade performance if theres too much data |
| `gitstash.explorer.itemDisplayMode`                       | Configures if empty repositories should be listed, hidden or indicate its emptiness. **This setting only applies if stashes are configured to be preloaded** |
| `gitstash.explorer.items.repository.labelContent`         | Specifies the format for each repository label. Available tokens: `${name}` - the repository name. `${directory}` - the repository directory base name. `${path}` - the repository directory path. `${stashesCount}` - the number of stashes on the repository |
| `gitstash.explorer.items.repository.descriptionContent`   | Specifies the format for each repository description. Available tokens: Same than repository.labelContent |
| `gitstash.explorer.items.repository.tooltipContent`       | Specifies the format for each repository tooltip. Available tokens: Same than repository.labelContent |
| `gitstash.explorer.items.repository.to-clipboardContent`  | Specifies repository data to be set on clipboard. Available tokens: Same than repository.labelContent
| `gitstash.explorer.items.stash.labelContent`              | Specifies the format for each stash label. Available tokens: `${branch}` - the branch where the stash was created. `${description}` - the custom or default description for the stash. `${dateTimeLong}` - the creation date & time, long format. `${dateTimeSmall}` - the creation date & time, medium format. `${dateSmall}` - the creation date, small format. `${dateTimeIso}` - the creation date & time, ISO format. `${dateIso}` - the creation date, ISO format. `${ago}` - the creation date, ago format. `${index}` - the stash index |
| `gitstash.explorer.items.stash.descriptionContent`        | Specifies the format for each stash description . Available tokens: Same than stash.labelContent |
| `gitstash.explorer.items.stash.tooltipContent`            | Specifies the format for each stash tooltip . Available tokens: Same than stash.labelContent |
| `gitstash.explorer.items.stash.to-clipboardContent`       | Specifies stash data to be set on clipboard. Available tokens: nSame than stash.labelContent |
| `gitstash.explorer.items.stash.popAndApply`               | Defines if pop or apply will be set as item button (and the secondary action as context menu option) |
| `gitstash.explorer.items.stash.diffButton`                | Defines which comparison to display from a file diff button |
| `gitstash.explorer.items.file.decoration`                 | Adds decorations to the tree items |
| `gitstash.explorer.items.file.icons`                      | Defines the icon to show on files |
| `gitstash.explorer.items.file.labelContent`               | Specifies the format for each file label. Available tokens: `${filename}` - the file name. `${filepath}` - the file path. `${type}` - the change type |
| `gitstash.explorer.items.file.descriptionContent`         | Specifies the format for each file description . Available tokens: Same than file.labelContent |
| `gitstash.explorer.items.file.tooltipContent`             | Specifies the format for each file tooltip . Available tokens: Same than file.labelContent |
| `gitstash.explorer.items.file.to-clipboardContent`        | Specifies file data to be set on clipboard. Available tokens: Same than file.labelContent. `${oldName}` - the previous name |
| `gitstash.explorer.items.renamedFile.labelContent`        | Specifies the format for each renamed file label. Available tokens: `${filename}` - the file name. `${oldFilename}` - the previous file name. `${filepath}` - the file path. `${type}` - the change type |
| `gitstash.explorer.items.renamedFile.descriptionContent`  | Specifies the format for each renamed file description . Available tokens: Same than renamedFile.labelContent |
| `gitstash.explorer.items.renamedFile.tooltipContent`      | Specifies the format for each renamed file tooltip . Available tokens: Same than renamedFile.labelContent |
| `gitstash.explorer.items.renamedFile.to-clipboardContent` | Specifies file data to be set on clipboard. Available tokens: Same than renamedFile.labelContent |
| `gitstash.editor.diffTitleFormat`                         | Specifies the format for the diff editor title. Available tokens: `${filename}` - the file name. `${filepath}` - the file path. `${fileIndex}` - the file index. `${dateTimeLong}` - the stash date & time, long format. `${dateTimeSmall}` - the stash date & time, medium format. `${dateSmall}` - the stash date, small format. `${dateTimeIso}` - the stash date & time, ISO format. `${dateIso}` - the stash date, ISO format. `${ago}` - the stash date, ago format. `${description}` - the stash description. `${branch}` - the stash branch. `${stashIndex}` - the stash index. `${type}` - the change type on the file like 'Modified' or 'Deleted'. `${hint}` - like `${type}` but indicates also the editor position of the change |
| `gitstash.log.autoclear`                                  | Clears the log window before showing the action result |
| `gitstash.advanced.repositorySearchDepth`                 | Search depth for finding repositories on subdirectories. If value is negative parent directory repositories will be searched |


## Tips

- Contrary to the git stash command included in VS Code, with `Stash... - Stash only` you can generate a stash even though all your changes are already added to index.
- Use `Stash... - Keep index` if you want to make two or more commits out of the changes in the working tree and you want to isolate features to test each change before committing.
- With `Git Stash` + `Stash Apply...` you can make a backup in case you want to make some cleanup for incomplete features before making a commit.
- You may want to control when to see the stash explorer, to do so add a key binding to execute `gitstash.explorer.toggle` and configure the extension to not to show the stash explorer tree when starting the editor with `gitstash.explorer.enabled`.
