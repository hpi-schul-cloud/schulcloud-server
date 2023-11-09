import { Injectable } from '@nestjs/common';
import { promises as fsp, existsSync } from 'fs';
import os from 'os';
import path from 'path';

import rimraf = require('rimraf');

const { mkdir, readdir, writeFile, readFile, mkdtemp } = fsp;

@Injectable()
export class FileSystemAdapter {
	private encoding: BufferEncoding;

	constructor() {
		this.encoding = 'utf-8';
	}

	get EOL(): string {
		return os.EOL;
	}

	/**
	 * creates a directory if not already exists
	 * @param folderPath
	 */
	async createDir(folderPath: string): Promise<void> {
		const exists = existsSync(folderPath);
		if (!exists) await mkdir(folderPath);
	}

	/**
	 * Lists filenames of given folderPath
	 * @param folderPath path to an existing folder
	 * @returns string array of filenames
	 */
	async readDir(folderPath: string): Promise<string[]> {
		const filenames = await readdir(folderPath, { encoding: this.encoding });
		return filenames;
	}

	/**
	 * Write text to file, will override existing files.
	 * The folder in which the file will be created must exist.
	 * The path format depends on os
	 * @param filePath path to a file
	 * @param text
	 */
	async writeFile(filePath: string, text: string): Promise<void> {
		await writeFile(filePath, text);
	}

	/**
	 * Read file from filesystem with given encoding, defaults to utf-8
	 * @param filePath path to existing file, format depending on os
	 * @returns file content as encoded text
	 */
	async readFile(filePath: string): Promise<string> {
		const text = await readFile(filePath, this.encoding);
		return text;
	}

	/**
	 * Creates a folder in systems temp path.
	 * The dirNamePrefix given will be extended by six random characters.
	 * @param dirNamePrefix
	 * @returns full path string to temp folder, format depends on os
	 */
	async createTmpDir(dirNamePrefix: string): Promise<string> {
		const dirPath = this.joinPath(os.tmpdir(), dirNamePrefix);
		const tmpDirPath = await mkdtemp(dirPath);
		return tmpDirPath;
	}

	/**
	 * Removes the given folder recursively including content when not empty.
	 * @param folderPath path to an existing folder, format depending on
	 */
	async removeDirRecursive(folderPath: string): Promise<void> {
		// fs.rm changed in node 14.14, use rimraf instead
		rimraf.sync(folderPath);
		return Promise.resolve();
	}

	joinPath(...paths: string[]): string {
		return path.join(...paths);
	}
}
