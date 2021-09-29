import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class FileSystemAdapter {
	private encoding: BufferEncoding;

	constructor() {
		// TODO configuration
		this.encoding = 'utf-8';
	}

	/**
	 * Lists filenames of given folderPath
	 * @param folderPath
	 * @returns
	 */
	readDirSync(folderPath: string): string[] {
		const filenames = fs.readdirSync(folderPath, { encoding: this.encoding });
		return filenames;
	}

	/**
	 * Write text to file, will override existing files.
	 * @param filePath
	 * @param text
	 */
	writeFileSync(filePath: string, text: string): void {
		fs.writeFileSync(filePath, text);
	}

	/**
	 * Read file from filesystem with given encoding, defaults to utf-8
	 * @param filePath
	 * @returns
	 */
	readFileSync(filePath: string): string {
		const text = fs.readFileSync(filePath, this.encoding);
		return text;
	}

	/**
	 * Creates a folder in systems temp path.
	 * The folder name given will be extended by six random characters.
	 */
	createTmpDir(dirNamePrefix: string): string {
		const tmpDirPath = fs.mkdtempSync(path.join(os.tmpdir(), dirNamePrefix));
		return tmpDirPath;
	}

	/**
	 * Removes the given folder recursively including content when not empty.
	 */
	removeDirRecursive(folderPath: string): void {
		fs.rmdirSync(folderPath, { recursive: true });
	}
}
