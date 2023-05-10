import { IFileStats, ITemporaryFile, ITemporaryFileStorage, IUser } from '@lumieducation/h5p-server';
import { access, constants, open, stat, unlink } from 'node:fs/promises';
import { accessSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { FileStats } from './file-stats';

export class TemporaryFileStorage implements ITemporaryFileStorage {
	private path: string;

	constructor(path: string) {
		this.path = path;
		// eslint-disable-next-line no-bitwise
		accessSync(path, constants.R_OK | constants.W_OK);
	}

	checkFilename(filename: string): void {
		if (/^[a-zA-Z0-9/.-_]*$/.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new Error(`Filename contains forbidden characters ${filename}`);
	}

	public async deleteFile(filename: string, userId: string): Promise<void> {
		this.checkFilename(filename);
		await unlink(join(this.path, filename));
	}

	public async fileExists(filename: string, user: IUser): Promise<boolean> {
		this.checkFilename(filename);
		try {
			await access(join(this.path, filename));
		} catch (error) {
			return false;
		}
		return true;
	}

	public async getFileStats(filename: string, user: IUser): Promise<FileStats> {
		this.checkFilename(filename);
		const stats = await stat(join(this.path, filename));
		return new FileStats(stats.birthtime, stats.size);
	}

	public async getFileStream(
		filename: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		this.checkFilename(filename);
		const file = await open(join(this.path, filename)); // file is auto closed
		return file.createReadStream({
			start: rangeStart,
			end: rangeEnd,
		});
	}

	public async listFiles(user?: IUser | undefined): Promise<ITemporaryFile[]> {
		this.checkFilename(filename);
		
	}

	public async sanitizeFilename?(filename: string): string {
		this.checkFilename(filename);
	}

	public async saveFile(filename: string, dataStream: ReadStream, user: IUser, expirationTime: Date): Promise<ITemporaryFile> {
		this.checkFilename(filename);
	}
}
