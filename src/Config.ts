'use strict';

import { workspace } from 'vscode';

export default class {
    public settings;

    constructor() {
        this.reload();
    }

    /**
     * Loads the plugin config.
     */
    public reload() {
        this.settings = workspace.getConfiguration('gitstash');
    }
}
