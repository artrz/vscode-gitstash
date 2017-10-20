# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [[0.7.0] 2017-10-19](https://github.com/arturock/vscode-gitstash/tree/v0.7.0)
  - Updates
    - Better file support
    - More specific icons
    - Stash list entries on commands are now formatted
  - Fixes
    - Explorer showing non stash files in some cases
    - Not showing contents of indexed untracked files

## [[0.6.0] 2017-10-01](https://github.com/arturock/vscode-gitstash/tree/v0.6.0)
- Explorer Tree
  - Add buttons
- Settings
  - Autoclear log
  - show / hide the explorer buttons
- Commands
  - Reload tree
  - show / hide explorer

Commands are now listed only when on a git repository

## [[0.5.0] 2017-10-01](https://github.com/arturock/vscode-gitstash/tree/v0.5.0)
 - Add missing commands
   - Save simple, keep index, include untracked, stash all
   - Pop w/ reindex
   - Apply w/ reindex
   - Branch
- Explorer Tree
  - Show stashed untracked files too
  - Update icons

## [[0.4.0] 2017-09-29](https://github.com/arturock/vscode-gitstash/tree/v0.4.0)
- Add commands
  - Apply
  - Drop
  - Clear
- Explorer Tree
  - Improve auto-reload time

## [[0.3.1] 2017-09-26](https://github.com/arturock/vscode-gitstash/tree/v0.3.1)
- Fix trimming diff data

## [[0.3.0] 2017-09-26](https://github.com/arturock/vscode-gitstash/tree/v0.3.0)
- Configure diff view title
- Improve stash watcher

## [[0.2.0] 2017-09-25](https://github.com/arturock/vscode-gitstash/tree/v0.2.0)
- Add configurations for tree items

## [[0.1.0] 2017-09-24](https://github.com/arturock/vscode-gitstash/tree/v0.1.0)
- Initial release
  - Display an explorer tree with the stash entries and their files
  - Click on stashed file displays a diff view with the changes
