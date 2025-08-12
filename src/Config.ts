/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import BaseConfig from './Foundation/Config'

export default class Config extends BaseConfig {
    public readonly key = {
        advancedRepoSearchDepth: 'advanced.repositorySearchDepth',

        expEnabled: 'explorer.enabled',
        expButtons: 'explorer.buttons',

        expItemsRepoLabel: 'explorer.items.repository.labelContent',
        expItemsRepoDescription: 'explorer.items.repository.descriptionContent',
        expItemsRepoTooltip: 'explorer.items.repository.tooltipContent',
        expItemsRepoToClipboard: 'explorer.items.repository.to-clipboardContent',

        expItemsStashLabel: 'explorer.items.stash.labelContent',
        expItemsStashDescription: 'explorer.items.stash.descriptionContent',
        expItemsStashTooltip: 'explorer.items.stash.tooltipContent',
        expItemsStashPopAndApply: 'explorer.items.stash.popAndApply',
        expItemsStashDiffButton: 'explorer.items.stash.diffButton',
        expItemsStashToClipboard: 'explorer.items.stash.to-clipboardContent',

        expItemsFileIcons: 'explorer.items.file.icons',
        expItemsFileDecoration: 'explorer.items.file.decoration',
        expItemsFileLabel: 'explorer.items.file.labelContent',
        expItemsFileDescription: 'explorer.items.file.descriptionContent',
        expItemsFileTooltip: 'explorer.items.file.tooltipContent',
        expItemsFileToClipboard: 'explorer.items.file.to-clipboardContent',

        expItemsRenamedFileLabel: 'explorer.items.renamedFile.labelContent',
        expItemsRenamedFileDescription: 'explorer.items.renamedFile.descriptionContent',
        expItemsRenamedFileTooltip: 'explorer.items.renamedFile.tooltipContent',
        expItemsRenamedFileToClipboard: 'explorer.items.renamedFile.to-clipboardContent',

        explorerEagerLoadStashes: 'explorer.eagerLoadStashes',
        explorerItemDisplayMode: 'explorer.itemDisplayMode',
        editorDiffTitleFormat: 'editor.diffTitleFormat',

        logAutoclear: 'log.autoclear',
    } as const

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    public get<T>(section: typeof this.key[keyof typeof this.key]): T {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.settings.get(section)!
    }
}
