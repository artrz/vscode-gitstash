# Git Stash

Add extra git stash powers to VS Code.

## Features

 - Configurable explorer tree
   - Labels, descriptions, icons, tooltips, decorations
   - Text to send to clipboard depending on item type
   - Eager or lazy load items (performance related)
 - Configurable repository searching depth
 - Practically all stash commands with most common options
 - Apply actions to stashed data from the tree view
    - Apply, pop, drop stashes
    - Diff stashed file changes or compare with current file state
    - Apply changes from single stashed file
    - Copy to clipboard (right click)

This extension allows to comfortably create, apply, delete and inspect stashes. It results helpful when working on different features, switching to branches for modifications or creating sets of local experimental features.
Navigate on your stashes, and run basically all stash commands visually and review the results.

![GitStash preview](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/screencast.gif)

![Tree actions](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/tree.png)

![Success notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/success.png)

![Conflicts notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/conflicts.png)

![Failure notification](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/failure.png)

![Image diff](https://raw.githubusercontent.com/arturock/vscode-gitstash/master/resources/docs/image-diff.png)


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

| Name                                                      | Default                                                             | Description |
|-----------------------------------------------------------|---------------------------------------------------------------------|-------------|
| `gitstash.explorer.enabled`                               | `true`                                                              | Shows or hides the explorer on startup |
| `gitstash.explorer.buttons`                               | `true`                                                              | Shows or hides the explorer tree buttons |
| `gitstash.explorer.eagerLoadStashes`                      | `true`                                                              | If enabled, stashes will be preloaded instead of lazy loaded. This is required to see the stashes count but may degrade performance if theres too much data |
| `gitstash.explorer.itemDisplayMode`                       | `indicate-empty`                                                    | Configures if empty repositories should be listed, hidden or indicate its emptiness. **This setting only applies if stashes are configured to be preloaded** |
| `gitstash.explorer.items.repository.labelContent`         | `"${name}"`                                                         | Specifies the format for each repository label. Available tokens: `${name}` - the repository name. `${directory}` - the repository directory base name. `${path}` - the repository directory path. `${stashesCount}` - the number of stashes on the repository |
| `gitstash.explorer.items.repository.descriptionContent`   | `"(${stashesCount})"`                                               | Specifies the format for each repository description. Available tokens: Same than repository.labelContent |
| `gitstash.explorer.items.repository.tooltipContent`       | `"${path}\n└─ ${name}\n\t${stashesCount} stashes"`                  | Specifies the format for each repository tooltip. Available tokens: Same than repository.labelContent |
| `gitstash.explorer.items.repository.to-clipboardContent`  | `"${name} - ${path}${directory} (${stashesCount} stashes)"`         | Specifies repository data to be set on clipboard. Available tokens: Same than repository.labelContent
| `gitstash.explorer.items.stash.labelContent`              | `"${description}"`                                                  | Specifies the format for each stash label. Available tokens: `${branch}` - the branch where the stash was created. `${description}` - the custom or default description for the stash. `${dateTimeLong}` - the creation date & time, long format. `${dateTimeSmall}` - the creation date & time, medium format. `${dateSmall}` - the creation date, small format. `${dateTimeIso}` - the creation date & time, ISO format. `${dateIso}` - the creation date, ISO format. `${ago}` - the creation date, ago format. `${index}` - the stash index |
| `gitstash.explorer.items.stash.descriptionContent`        | `"${branch}, ${dateSmall}"`                                         | Specifies the format for each stash description . Available tokens: Same than stash.labelContent |
| `gitstash.explorer.items.stash.tooltipContent`            | `"#${index} ${dateTimeLong}\n${branch}, ${ago}\n\n${description}"`  | Specifies the format for each stash tooltip . Available tokens: Same than stash.labelContent |
| `gitstash.explorer.items.stash.to-clipboardContent`       | `"#${index} [${branch}] ${description}"`                            | Specifies stash data to be set on clipboard. Available tokens: nSame than stash.labelContent |
| `gitstash.explorer.items.file.decoration`                 | `color`                                                             | Adds decorations to the tree items |
| `gitstash.explorer.items.file.icons`                      | `file`                                                              | Defines the icon to show on files |
| `gitstash.explorer.items.file.labelContent`               | `"${filename}"`                                                     | Specifies the format for each file label. Available tokens: `${filename}` - the file name. `${filepath}` - the file path. `${type}` - the change type |
| `gitstash.explorer.items.file.descriptionContent`         | `"${filepath}"`                                                     | Specifies the format for each file description . Available tokens: Same than file.labelContent |
| `gitstash.explorer.items.file.tooltipContent`             | `"${filepath}\n└─ ${filename}\n\t• ${type}"`                        | Specifies the format for each file tooltip . Available tokens: Same than file.labelContent |
| `gitstash.explorer.items.file.to-clipboardContent`        | `"${filename} [${type}] - ${filepath}"`                             | Specifies file data to be set on clipboard. Available tokens: Same than file.labelContent. `${oldName}` - the previous name |
| `gitstash.explorer.items.renamedFile.labelContent`        | `"${filename}"`                                                     | Specifies the format for each renamed file label. Available tokens: `${filename}` - the file name. `${oldFilename}` - the previous file name. `${filepath}` - the file path. `${type}` - the change type |
| `gitstash.explorer.items.renamedFile.descriptionContent`  | `"${filepath}"`                                                     | Specifies the format for each renamed file description . Available tokens: Same than renamedFile.labelContent |
| `gitstash.explorer.items.renamedFile.tooltipContent`      | `"${filepath}\n└─ ${filename} ← ${oldFilename}\n\t• ${type}"`       | Specifies the format for each renamed file tooltip . Available tokens: Same than renamedFile.labelContent |
| `gitstash.explorer.items.renamedFile.to-clipboardContent` | `"${filename} [${type}:${oldName}] - ${filepath}"`                  | Specifies file data to be set on clipboard. Available tokens: Same than renamedFile.labelContent |
| `gitstash.editor.diffTitleFormat`                         | `"#${stashIndex}: ${filename}  ${hint} (${filepath})"`              | Specifies the format for the diff editor title. Available tokens: `${filename}` - the file name. `${filepath}` - the file path. `${fileIndex}` - the file index. `${dateTimeLong}` - the stash date & time, long format. `${dateTimeSmall}` - the stash date & time, medium format. `${dateSmall}` - the stash date, small format. `${dateTimeIso}` - the stash date & time, ISO format. `${dateIso}` - the stash date, ISO format. `${ago}` - the stash date, ago format. `${description}` - the stash description. `${branch}` - the stash branch. `${stashIndex}` - the stash index. `${type}` - the change type on the file like 'Modified' or 'Deleted'. `${hint}` - like `${type}` but indicates also the editor position of the change |
| `gitstash.log.autoclear`                                  | `false`                                                             | Clears the log window before showing the action result |
| `gitstash.advanced.repositorySearchDepth`                 | `1`                                                                 | Search depth for finding repositories |


## Tips

- Contrary to the git stash command included in VS Code, with `Stash... - Stash only` you can generate a stash even though all your changes are already added to index.
- Use `Stash... - Keep index` if you want to make two or more commits out of the changes in the work tree and you want to isolate features to test each change before committing.
- With `Git Stash` + `Stash Apply...` you can make a backup in case you want to make some cleanup for incomplete features before making a commit.
- You may want to control when to see the stash explorer, to do so add a key binding to execute `gitstash.explorer.toggle` and configure the extension to not to show the stash explorer tree when starting the editor with `gitstash.explorer.enabled`.
