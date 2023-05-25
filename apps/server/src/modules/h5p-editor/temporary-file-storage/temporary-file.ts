import { ITemporaryFile } from '@lumieducation/h5p-server';

export class TemporaryFile implements ITemporaryFile {
	/**
	 * Indicates when the temporary file should be deleted.
	 */
	expiresAt: Date;

	/**
	 * The name by which the file can be identified; can be a path including subdirectories (e.g. 'images/xyz.png')
	 */
	filename: string;

	/**
	 * The user who is allowed to access the file
	 */
	ownedByUserId: string;

	constructor(filename: string, ownedByUserId: string, expiresAt: Date) {
		this.filename = filename;
		this.ownedByUserId = ownedByUserId;
		this.expiresAt = expiresAt;
	}
}
