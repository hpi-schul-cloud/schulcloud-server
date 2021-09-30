import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class FileSystemAdapter {
	private encoding: BufferEncoding;

	private _EOL: string;

	constructor() {
		// TODO configuration
		this.encoding = 'utf-8';
		this._EOL = os.EOL;
	}

	get EOL() {
		return this._EOL;
	}

	/**
	 * Lists filenames of given folderPath
	 * @param folderPath path to an existing folder
	 * @returns string array of filenames
	 */
	readDirSync(folderPath: string): string[] {
		const filenames = fs.readdirSync(folderPath, { encoding: this.encoding });
		return filenames;
	}

	/**
	 * Write text to file, will override existing files.
	 * The folder in which the file will be created must exist.
	 * The path format depends on os
	 * @param filePath path to a file
	 * @param text
	 */
	writeFileSync(filePath: string, text: string): void {
		fs.writeFileSync(filePath, text);
	}

	/**
	 * Read file from filesystem with given encoding, defaults to utf-8
	 * @param filePath path to existing file, format depending on os
	 * @returns file content as encoded text
	 */
	readFileSync(filePath: string): string {
		const text = fs.readFileSync(filePath, this.encoding);
		return text;
	}

	/**
	 * Creates a folder in systems temp path.
	 * The dirNamePrefix given will be extended by six random characters.
	 * @param dirNamePrefix
	 * @returns full path string to temp folder, format depends on os
	 */
	createTmpDir(dirNamePrefix: string): string {
		const tmpDirPath = fs.mkdtempSync(path.join(os.tmpdir(), dirNamePrefix));
		return tmpDirPath;
	}

	/**
	 * Removes the given folder recursively including content when not empty.
	 * @param folderPath path to an existing folder, format depending on
	 */
	removeDirRecursive(folderPath: string): void {
		fs.rmdirSync(folderPath, { recursive: true });
	}
}
