/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

export default class ExecError extends Error {
    constructor(
        public code: number,
        public errorMessage: string,
        public context?: string,
    ) {
        super(`${errorMessage}${context}`.trim())
    }
}
