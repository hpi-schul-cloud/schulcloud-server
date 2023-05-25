/* eslint-disable no-await-in-loop */
// needed for listFiles()
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { accessSync, constants } from 'node:fs';
import { readFile, writeFile, access, mkdir, open, readdir, stat, rm, rmdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { relative } from 'path';
import { Injectable } from '@nestjs/common';
import { ITemporaryFile, ITemporaryFileStorage, IUser } from '@lumieducation/h5p-server';
import { FileStats } from '../file-stats';
import { TemporaryFile } from './temporary-file';

@Injectable()
export class TemporaryFileStorage implements ITemporaryFileStorage {
	constructor(private readonly path: string) {
		// eslint-disable-next-line no-bitwise
		accessSync(path, constants.R_OK | constants.W_OK);
	}

	private checkFilename(filename: string): void {
		if (/^[a-zA-Z0-9/._-]+$/g.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new Error(`Filename contains forbidden characters or is empty: '${filename}'`);
	}

	private async *readdirFilesRecursive(dirpath: string): AsyncGenerator<string> {
		const direntries = await readdir(dirpath, { withFileTypes: true });
		for (const entry of direntries) {
			const entrypath = join(dirpath, entry.name);
			if (entry.isDirectory()) {
				yield* this.readdirFilesRecursive(entrypath);
			} else {
				yield entrypath;
			}
		}
	}

	private async getFileInfo(filename: string, userId: string): Promise<ITemporaryFile> {
		this.checkFilename(filename);
		this.checkFilename(userId);
		const path = `${join(this.path, userId, filename)}.meta`;
		const data = await readFile(path);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const tempFileMetadata: TemporaryFile = JSON.parse(data.toString());
		return tempFileMetadata;
	}

	private async ensureDirExists(path: string) {
		const parent = dirname(path);
		if (parent && parent !== '/') {
			await this.ensureDirExists(parent);
		}
		try {
			await access(path);
		} catch {
			// TODO use correct error
			await mkdir(path);
		}
	}

	public sanitizeFilename?(filename: string): string {
		const sanitizedFilename = filename.replace(/[^a-zA-Z0-9/._-]/g, '_');
		this.checkFilename(sanitizedFilename);
		return sanitizedFilename;
	}

	public async deleteFile(filename: string, userId: string): Promise<void> {
		this.checkFilename(filename);
		this.checkFilename(userId);
		const filepath = join(this.path, userId, filename);
		await rm(filepath);
		await rm(`${filepath}.meta`);
		const dir = dirname(filename);
		if (dir !== '') {
			const dirpath = join(this.path, userId, dir);
			if ((await readdir(join(this.path, userId, dir))).length === 0) {
				await rmdir(dirpath);
			}
		}
	}

	public async fileExists(filename: string, user: IUser): Promise<boolean> {
		this.checkFilename(filename);
		this.checkFilename(user.id);
		try {
			await access(join(this.path, user.id, filename));
		} catch (error) {
			return false;
		}
		return true;
	}

	public async getFileStats(filename: string, user: IUser): Promise<FileStats> {
		this.checkFilename(filename);
		this.checkFilename(user.id);
		const stats = await stat(join(this.path, user.id, filename));
		return new FileStats(stats.birthtime, stats.size);
	}

	public async getFileStream(
		filename: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		this.checkFilename(filename);
		this.checkFilename(user.id);
		const file = await open(join(this.path, user.id, filename)); // file is auto closed
		const stream = file.createReadStream({
			start: rangeStart,
			end: rangeEnd,
		});
		return stream;
	}

	public async listFiles(user?: IUser | undefined): Promise<ITemporaryFile[]> {
		if (user) {
			this.checkFilename(user.id);
			await access(join(this.path, user.id));
		}
		const users: Array<string> = user ? [user.id] : await readdir(this.path);
		const tempFiles: Array<ITemporaryFile> = [];
		for (const currentUser of users) {
			// no-await-in-loop es-lint check disabled here
			// user by user should be okay here, otherwise there could be thousands of promises at once
			// list ALL files is only needed for clean up job
			const userpath = join(this.path, currentUser);
			const userFiles: string[] = [];
			for await (const file of this.readdirFilesRecursive(join(this.path, currentUser))) {
				userFiles.push(relative(userpath, file));
			}
			const newTempFiles = await Promise.all(
				userFiles
					.filter((userFile) => !userFile.endsWith('.meta'))
					.map(async (userFile) => this.getFileInfo(userFile, currentUser))
			);
			tempFiles.push(...newTempFiles);
		}
		return tempFiles;
	}

	public async saveFile(
		filename: string,
		dataStream: ReadStream,
		user: IUser,
		expirationTime: Date
	): Promise<ITemporaryFile> {
		this.checkFilename(filename);
		this.checkFilename(user.id);
		const now = new Date();
		if (expirationTime < now) {
			throw new Error('expirationTime must be in the future');
		}

		const path = join(this.path, user.id, filename);
		await this.ensureDirExists(dirname(path));

		await writeFile(path, dataStream);
		const meta = new TemporaryFile(filename, user.id, expirationTime);
		await writeFile(`${path}.meta`, JSON.stringify(meta));

		return meta;
	}
}
