# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
  - Actions to tree entries
    - Stash
      - Apply/pop and Drop
    - File
      - Diff to file in current state
      - Apply changes from single file
  - More Keep index commands
### Updated
  - Icons are now consistent with the general UI
  - Improve default stash tooltips for tree items
  - Notify when a stash application has conflicts
  - Log shows date, git command and involved stash if available

## [[0.8.0] 2018-08-25](https://github.com/arturock/vscode-gitstash/tree/v0.8.0)
### Added
  - Binary files like images are now supported
  - Configurable tooltips for tree elements
### Updated
  - Tree is now displayed on SCM view container
  - A new default configuration for tree entries to remove some clutter
  - Update refresh icon
  - Slightly faster diff displaying
### Fixed
  - Some text encoding problems

## [[0.7.1] 2017-10-20](https://github.com/arturock/vscode-gitstash/tree/v0.7.1)
### Fixed
- Show log only when requested

## [[0.7.0] 2017-10-19](https://github.com/arturock/vscode-gitstash/tree/v0.7.0)
### Updated
- Better file support
- More specific icons
- Stash list entries on commands are now formatted
### Fixed
- Explorer showing non stash files in some cases
- Not showing contents of indexed untracked files

## [[0.6.0] 2017-10-01](https://github.com/arturock/vscode-gitstash/tree/v0.6.0)
### Added
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
### Added
- Missing commands
  - Save simple, keep index, include untracked, stash all
  - Pop w/ reindex
  - Apply w/ reindex
  - Branch
- Explorer Tree
  - Show stashed untracked files too
### Updated
- Explorer Tree icons

## [[0.4.0] 2017-09-29](https://github.com/arturock/vscode-gitstash/tree/v0.4.0)
### Added
- Commands
  - Apply
  - Drop
  - Clear
### Updated
- Improve auto-reload time in explorer tree

## [[0.3.1] 2017-09-26](https://github.com/arturock/vscode-gitstash/tree/v0.3.1)
### Fixed
- Trimming diff data breaking some results

## [[0.3.0] 2017-09-26](https://github.com/arturock/vscode-gitstash/tree/v0.3.0)
- Configure diff view title
### Updated
- Improve stash watcher

## [[0.2.0] 2017-09-25](https://github.com/arturock/vscode-gitstash/tree/v0.2.0)
### Added
- Configurations for tree items

## [[0.1.0] 2017-09-24](https://github.com/arturock/vscode-gitstash/tree/v0.1.0)
### Added
- Initial release
  - Display an explorer tree with the stash entries and their files
  - Click on stashed file displays a diff view with the changes
