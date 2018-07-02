'use strict';

import { commands } from 'vscode';
import Git from './Git';

(new Git()).hasGitRepository().then(() => {
    commands.executeCommand('setContext', 'hasGitRepository', true);
});
