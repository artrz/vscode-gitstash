# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [[5.2.0] 2023-04-30](https://github.com/arturock/vscode-gitstash/tree/v5.2.0)

### Added

 - Allow to configure if pop or apply will available as main or secondary stash item action
 - Allow to configure the alternative diff action for the stashed file compare button
 - Other comparison modes for diffing changes
 - Branch command on stash context menu

### Updated

 - Breadcrumbs like text on commands' selection placeholders
 - Dependency updates

### Fixed

- Id uniqueness for stash items on the explorer tree

## [[5.1.0] 2021-09-12](https://github.com/arturock/vscode-gitstash/tree/v5.1.0)

### Added

- Allow to stash selected files from the source control view via context menu

### Fixed

- Typo in config key

## [[5.0.0] 2021-09-10](https://github.com/arturock/vscode-gitstash/tree/v5.0.0)

### Added

- Allow to lazy load explorer items to improve performance
- Setting to configure if empty repositories should be listed or not
- Configurable file icons on tree items
- Decorations on tree items

### Fixed

- Remove wrong commands from palette

## [[4.0.0] 2021-07-27](https://github.com/arturock/vscode-gitstash/tree/v4.0.0)

### Added

- Tree items descriptions
- Open project directory from explorer
- Open stashed file current copy from explorer

### Updated

- New settings and defaults for explorer items elements
- Prefer codicons when possible (vscode [1.52](https://code.visualstudio.com/updates/v1_52#_support-for-codicons-for-view-containers-views))
- Better copy to clipboard submenus (vscode [1.50](https://code.visualstudio.com/updates/v1_50#_submenus))
- Use latest major version dependencies

### Fixed

- Files on expanded stashes disappeared when reloading tree

## [[3.3.1] 2020-10-22](https://github.com/arturock/vscode-gitstash/tree/v3.3.1)

### Fixed

- Wrong documentation on some labels
- Remove wrong command from palette

## [[3.3.0] 2020-09-27](https://github.com/arturock/vscode-gitstash/tree/v3.3.0)

### Added

- Allow to copy to clipboard stash information from tree view

## [[3.2.2] 2020-09-27](https://github.com/arturock/vscode-gitstash/tree/v3.2.2)

### Fixed

- Typo on tooltip - thanks to [@Dylanlan](https://github.com/Dylanlan)

## [[3.2.1] 2020-07-26](https://github.com/arturock/vscode-gitstash/tree/v3.2.1)

### Updated

- Latest dependencies
- New code style

## [[3.2.0] 2019-11-10](https://github.com/arturock/vscode-gitstash/tree/v3.2.0)

### Added

- Allow configuration to show the number of stashes on the explorer repository label

## [[3.1.0] 2019-09-23](https://github.com/arturock/vscode-gitstash/tree/v3.1.0)

### Added

- Allow to include repositories on parent directories

### Fixed

- Not refreshing automatically the stashes explorer on Windows under some circumstances

## [[3.0.0] 2019-09-09](https://github.com/arturock/vscode-gitstash/tree/v3.0.0)

### Added

- Allow to configure a search depth for finding repositories on subdirectories
- Support for renamed files
- Custom labels for each change type

### Updated

- Improve the extension loading time and lower extension size
- Improve and speed up the way diff file contents are shown
- Replace some icons with the latest ones from Visual Studio Code
- Renamed some settings
- Some libraries

### Fixed

- Not handling correctly file paths with spaces in their names
- Better success/error identification when running git commands

## [[2.1.1] 2019-05-15](https://github.com/arturock/vscode-gitstash/tree/v2.1.1)

### Fixed

Showing duplicated repositories on tree in some cases - thanks to [@nckcol](https://github.com/nckcol)

## [[2.1.0] 2019-04-09](https://github.com/arturock/vscode-gitstash/tree/v2.1.0)

### Added

- Tree
  - File
    - Recreate untracked file

## [[2.0.0] 2019-04-08](https://github.com/arturock/vscode-gitstash/tree/v2.0.0)

### Added

- Multi-root support

### Updated

- Some icons
- Settings
  - Rename some settings
  - Update some default formats

## [[1.0.2] 2019-02-02](https://github.com/arturock/vscode-gitstash/tree/v1.0.2)

### Fixed

- Unable to compare with current version on Win

## [[1.0.1] 2018-11-01](https://github.com/arturock/vscode-gitstash/tree/v1.0.1)

### Fixed

- Unable to create stash when al changes are staged

## [[1.0.0] 2018-10-16](https://github.com/arturock/vscode-gitstash/tree/v1.0.0)

### Added

- Actions on tree stashes
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
- A new default configuration for tree stashes to remove some clutter
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
- Stashes list on commands are now formatted

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
  - Display an explorer tree with the stashes and their files
  - Click on stashed file displays a diff view with the changes
