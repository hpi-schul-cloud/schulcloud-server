export class BoardImportJobUnreadableError extends Error {
	constructor(cause: unknown) {
		super('Board import job cannot be read', { cause });
	}
}
