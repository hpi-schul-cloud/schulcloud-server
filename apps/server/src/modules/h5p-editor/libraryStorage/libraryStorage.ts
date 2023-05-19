import {
	InstalledLibrary,
	LibraryName,
	type IAdditionalLibraryMetadata,
	type IFileStats,
	type IInstalledLibrary,
	type ILibraryMetadata,
	type ILibraryName,
	type ILibraryStorage,
} from '@lumieducation/h5p-server';
import { Injectable } from '@nestjs/common';

import fsSync, { constants as FSConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'stream';

@Injectable()
export class LibraryStorage implements ILibraryStorage {
	/**
	 * @param libraryDirectory Path of the directory in which the libraries are stored. Will be created if it does not exist.
	 */
	public constructor(private libraryDirectory: string) {
		fsSync.mkdirSync(libraryDirectory, { recursive: true });
	}

	/**
	 * Returns the directory of the library.
	 * @param library
	 * @returns the absolute path to the library directory
	 */
	private getDirectoryPath(library: ILibraryName): string {
		const uberName = LibraryName.toUberName(library);
		const directoryPath = path.join(this.libraryDirectory, uberName);
		return directoryPath;
	}

	/**
	 * Returns the path of the file from the library.
	 * @param library
	 * @param filename
	 * @returns the absolute path to the file
	 */
	private getFilePath(library: ILibraryName, filename: string): string {
		const uberName = LibraryName.toUberName(library);
		const filePath = path.join(this.libraryDirectory, uberName, filename);
		return filePath;
	}

	/**
	 * Checks if the filename is absolute or traverses outside the directory.
	 * Throws an error if the filename is illegal.
	 * @param filename the requested file
	 */
	private checkFilename(filename: string): void {
		if (path.normalize(filename).startsWith(`..${path.sep}`) || path.isAbsolute(filename)) {
			throw new Error('Illegal filename');
		}
	}

	/**
	 * Checks if the path can be accessed
	 * @param filePath
	 * @param options file access constant
	 */
	private async pathAccessible(filePath: string, options = FSConstants.F_OK) {
		try {
			await fs.access(filePath, options);
			return true;
		} catch (err) {
			return false;
		}
	}

	/**
	 * Adds a file to a library. Library metadata must be installed using `installLibrary` first.
	 * @param library
	 * @param filename
	 * @param dataStream
	 * @returns true if successful
	 */
	public async addFile(library: ILibraryName, filename: string, dataStream: Readable): Promise<boolean> {
		this.checkFilename(filename);

		if (!(await this.isInstalled(library))) {
			throw new Error(`Could not add file to library ${LibraryName.toUberName(library)}`);
		}

		const fullPath = this.getFilePath(library, filename);
		await fs.mkdir(path.dirname(fullPath), { recursive: true });
		await fs.writeFile(fullPath, dataStream);

		return true;
	}

	/**
	 * Adds the metadata of the library
	 * @param libraryMetadata
	 * @param restricted
	 * @returns The newly created library object
	 */
	public async addLibrary(libraryMetadata: ILibraryMetadata, restricted: boolean): Promise<IInstalledLibrary> {
		const library = new InstalledLibrary(
			libraryMetadata.machineName,
			libraryMetadata.majorVersion,
			libraryMetadata.minorVersion,
			libraryMetadata.patchVersion,
			restricted
		);

		const libraryPath = this.getDirectoryPath(library);

		if (await this.pathAccessible(libraryPath)) {
			throw new Error(`Can't add library because it already exists`);
		}

		try {
			await fs.mkdir(libraryPath, { recursive: true });

			const libraryMetadataPath = this.getFilePath(library, 'library.json');
			await fs.writeFile(libraryMetadataPath, JSON.stringify(libraryMetadata, undefined, 2));
			return library;
		} catch (error) {
			await fs.rm(libraryPath, { recursive: true, force: true });
			throw error;
		}
	}

	/**
	 * Removes all files of a library, but keeps the metadata
	 * @param library
	 */
	public async clearFiles(library: ILibraryName): Promise<void> {
		if (!(await this.isInstalled(library))) {
			throw new Error("Can't clear library files, because it is not installed");
		}

		const fullLibraryPath = this.getDirectoryPath(library);
		const files = (await fs.readdir(fullLibraryPath)).filter((file) => file !== 'library.json');

		await Promise.all(files.map((entry) => fs.rm(this.getFilePath(library, entry), { recursive: true, force: true })));
	}

	/**
	 * Deletes metadata and all files of the library
	 * @param library
	 */
	public async deleteLibrary(library: ILibraryName): Promise<void> {
		const libPath = this.getDirectoryPath(library);

		if (!(await this.pathAccessible(libPath))) {
			throw new Error("Can't delete library, because it is not installed");
		}

		await fs.rm(libPath, { recursive: true, force: true });
	}

	/**
	 * Checks if the file exists in the library
	 * @param library
	 * @param filename
	 * @returns true if the file exists, false otherwise
	 */
	public async fileExists(library: ILibraryName, filename: string): Promise<boolean> {
		this.checkFilename(filename);

		return this.pathAccessible(this.getFilePath(library, filename));
	}

	/**
	 * Counts how often libraries are listed in the dependencies of other libraries and returns a list of the number.
	 * @returns an object with ubernames as key.
	 */
	public async getAllDependentsCount(): Promise<{ [ubername: string]: number }> {
		const installedLibraries = await this.getInstalledLibraryNames();
		const librariesMetadata = await Promise.all(installedLibraries.map((lib) => this.getLibrary(lib)));

		const librariesMetadataMap = new Map(
			installedLibraries.map((library, idx) => [LibraryName.toUberName(library), librariesMetadata[idx]])
		);

		// Remove circular dependencies
		for (const libraryMetadata of librariesMetadata) {
			for (const dependency of libraryMetadata.editorDependencies ?? []) {
				const ubername = LibraryName.toUberName(dependency);

				const dependencyMetadata = librariesMetadataMap.get(ubername);

				if (dependencyMetadata?.preloadedDependencies) {
					const index = dependencyMetadata.preloadedDependencies.findIndex((libName) =>
						LibraryName.equal(libName, libraryMetadata)
					);

					if (index >= 0) {
						dependencyMetadata.preloadedDependencies.splice(index, 1);
					}
				}
			}
		}

		// Count dependencies
		const dependencies: { [ubername: string]: number } = {};
		for (const libraryData of librariesMetadata) {
			const { preloadedDependencies = [], editorDependencies = [], dynamicDependencies = [] } = libraryData;

			for (const dependency of preloadedDependencies.concat(editorDependencies, dynamicDependencies)) {
				const ubername = LibraryName.toUberName(dependency);
				dependencies[ubername] = (dependencies[ubername] ?? 0) + 1;
			}
		}

		return dependencies;
	}

	/**
	 * Counts how many dependents the library has.
	 * @param library
	 * @returns the count
	 */
	public async getDependentsCount(library: ILibraryName): Promise<number> {
		const allDependencies = await this.getAllDependentsCount();
		return allDependencies[LibraryName.toUberName(library)] ?? 0;
	}

	/**
	 * Returns the file as a JSON-parsed object
	 * @param library
	 * @param file
	 */
	public async getFileAsJson(library: ILibraryName, file: 'library.json'): Promise<ILibraryMetadata>;
	public async getFileAsJson(library: ILibraryName, file: string): Promise<unknown>;
	public async getFileAsJson(library: ILibraryName, file: string): Promise<unknown> {
		const content = await this.getFileAsString(library, file);
		return JSON.parse(content) as unknown;
	}

	/**
	 * Returns the file as a utf-8 string
	 * @param library
	 * @param file
	 */
	public async getFileAsString(library: ILibraryName, file: string): Promise<string> {
		const contents = await fs.readFile(this.getFilePath(library, file), 'utf-8');
		return contents;
	}

	/**
	 * Returns information about a library file
	 * @param library
	 * @param file
	 */
	public async getFileStats(library: ILibraryName, file: string): Promise<IFileStats> {
		if (!(await this.fileExists(library, file))) {
			throw new Error('The requested file does not exist');
		}

		const stats = fs.stat(this.getFilePath(library, file));
		return stats;
	}

	/**
	 * Returns a readable stream of the file's contents.
	 * @param library
	 * @param file
	 */
	public getFileStream(library: ILibraryName, file: string): Promise<Readable> {
		const readStream = fsSync.createReadStream(this.getFilePath(library, file));
		return Promise.resolve(readStream);
	}

	/**
	 * Lists all installed libraries or the installed libraries that have the machine name
	 * @param machineName (optional) only return libraries that have this machine name
	 */
	public async getInstalledLibraryNames(machineName?: string): Promise<ILibraryName[]> {
		const nameRegex = /^([\w.]+)-(\d+)\.(\d+)$/i; // abc-12.34
		const libDirEntries = await fs.readdir(this.libraryDirectory);

		const libraries = libDirEntries
			.filter((name) => nameRegex.test(name))
			.map((name) => LibraryName.fromUberName(name))
			.filter((lib) => !machineName || lib.machineName === machineName);

		return libraries;
	}

	/**
	 * Lists all languages supported by a library
	 * @param library
	 */
	public async getLanguages(library: ILibraryName): Promise<string[]> {
		const languageDirEntries = await fs.readdir(this.getFilePath(library, 'language'));

		const languages = languageDirEntries
			.filter((file) => path.extname(file) === '.json')
			.map((file) => path.basename(file, '.json'));

		return languages;
	}

	/**
	 * Returns the library metadata
	 * @param library
	 */
	public async getLibrary(library: ILibraryName): Promise<IInstalledLibrary> {
		if (!(await this.isInstalled(library))) {
			throw new Error('The requested library does not exist');
		}

		const libraryMetadata = await this.getFileAsJson(library, 'library.json');
		const installedLibrary = InstalledLibrary.fromMetadata(libraryMetadata);

		return installedLibrary;
	}

	/**
	 * Checks if a library is installed
	 * @param library
	 */
	public async isInstalled(library: ILibraryName): Promise<boolean> {
		return this.pathAccessible(this.getFilePath(library, 'library.json'));
	}

	/**
	 * Lists all addons that are installed in the system.
	 */
	public async listAddons(): Promise<ILibraryMetadata[]> {
		const installedLibraryNames = await this.getInstalledLibraryNames();
		const installedLibraries = await Promise.all(installedLibraryNames.map((addonName) => this.getLibrary(addonName)));
		const addons = installedLibraries.filter((library) => library.addTo !== undefined);

		return addons;
	}

	/**
	 * Returns all files that are a part of the library
	 * @param library
	 * @returns an array of filenames
	 */
	public async listFiles(library: ILibraryName): Promise<string[]> {
		const libPath = this.getDirectoryPath(library);

		// Returns an async iterator
		async function* getAllFiles(filepath: string): AsyncGenerator<string> {
			const entries = await fs.readdir(filepath, { withFileTypes: true });

			for (const file of entries) {
				if (file.isDirectory()) {
					yield* getAllFiles(path.join(filepath, file.name));
				} else {
					yield path.join(filepath, file.name);
				}
			}
		}

		const files: string[] = [];
		for await (const file of getAllFiles(libPath)) {
			files.push(file);
		}

		return files;
	}

	/**
	 * Updates the additional metadata properties that are added to the stored libraries.
	 * @param library
	 * @param additionalMetadata
	 */
	public async updateAdditionalMetadata(
		library: ILibraryName,
		additionalMetadata: Partial<IAdditionalLibraryMetadata>
	): Promise<boolean> {
		const libraryMetadata = await this.getLibrary(library);

		let dirty = false;
		for (const [property, value] of Object.entries(additionalMetadata)) {
			if (value !== libraryMetadata[property]) {
				libraryMetadata[property] = value;
				dirty = true;
			}
		}

		// Don't write file if nothing has changed
		if (!dirty) {
			return false;
		}

		try {
			await fs.writeFile(this.getFilePath(library, 'library.json'), JSON.stringify(libraryMetadata, undefined, 2));
			return true;
		} catch (error) {
			throw new Error('Could not update metadata');
		}
	}

	/**
	 * Updates the library metadata
	 * @param libraryMetadata
	 */
	async updateLibrary(libraryMetadata: ILibraryMetadata): Promise<IInstalledLibrary> {
		const libPath = this.getDirectoryPath(libraryMetadata);

		if (!(await this.pathAccessible(libPath))) {
			throw new Error('Library is not installed');
		}

		const libraryJsonPath = this.getFilePath(libraryMetadata, 'library.json');
		await fs.writeFile(libraryJsonPath, JSON.stringify(libraryMetadata, undefined, 2));

		const newLibrary = InstalledLibrary.fromMetadata(libraryMetadata);
		return newLibrary;
	}
}
