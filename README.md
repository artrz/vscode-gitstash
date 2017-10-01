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

| Title                    | Description
|--------------------------|------------
| Stash...                 | Generate a stash with custom options. Use `stash only` to generate a simple stash. Use `Keep index` to stash but keep all changes added to the index intact (besides stashing them). Use `Include untracked` if you want to stash also untracked files, leaving the working directory in a very clean state. If you want to stash besides the untracked files, the ingored ones, use the `All` option instead.
| Stash Pop and reindex... | Pops a stash w/ file reindexing, so every change added to index will be back to that state. this can fail, when you have conflicts (which are stored in the index, where you therefore can no longer apply the changes as they were originally).
| Stash Apply...           | Applies a stash w/ or w/o file reindexing. When selecting reindexing it will work the same as Stash Pop with reindex.
| Stash Branch...          | Creates and checks out a new branch starting from the commit at which the stash was originally created, applies the changes recorded in the selected stash to the new working tree and index. If that succeeds the stash will be dropped.
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


## Tips

- Contrary to the git stash command included in VS Code, with `Stash... - Stash only` you can generate a stash even tough all your changes are already added to index.
 - Use `Stash... - Keep index` if you want to make two or more commits out of the changes in the work tree and you want to isolate features to test each change before committing.
 - With `Git Stash` + `Stash Apply...` you can make a backup in case you want to make some cleanup for incomplete features before making a commit.
