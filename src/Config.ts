'use strict';

import { workspace, WorkspaceConfiguration } from 'vscode';

export default class {
    public settings: WorkspaceConfiguration;

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
