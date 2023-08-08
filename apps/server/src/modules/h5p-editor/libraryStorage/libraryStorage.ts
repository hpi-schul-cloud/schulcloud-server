import {
	LibraryName,
	type IAdditionalLibraryMetadata,
	type IFileStats,
	type IInstalledLibrary,
	type ILibraryMetadata,
	type ILibraryName,
	type ILibraryStorage,
} from '@lumieducation/h5p-server';
import { Inject, Injectable } from '@nestjs/common';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { FileDto } from '@src/modules/files-storage/dto';
import path from 'node:path';
import type { Readable } from 'stream';
import { FileMetadata, InstalledLibrary } from './library.entity';
import { LibraryRepo } from './library.repo';

@Injectable()
export class LibraryStorage implements ILibraryStorage {
	/**
	 * @param
	 */
	constructor(
		private readonly libraryRepo: LibraryRepo,
		@Inject('S3ClientAdapter_Libraries') private readonly s3Client: S3ClientAdapter
	) {}

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
	 * Returns the path of the file from the library.
	 * @param library
	 * @param filename
	 * @returns the absolute path to the file
	 */
	private getFilePath(library: ILibraryName, filename: string): string {
		const uberName = LibraryName.toUberName(library);
		const filePath = `h5p-libraries/${uberName}/${filename}`;
		return filePath;
	}

	/**
	 * Adds a file to a library. Library metadata must be installed using `installLibrary` first.
	 * @param library
	 * @param filename
	 * @param dataStream
	 * @returns true if successful
	 */
	public async addFile(libraryName: ILibraryName, filename: string, dataStream: Readable): Promise<boolean> {
		this.checkFilename(filename); // TODO: do this everywhere?

		const library = await this.libraryRepo.findOneByNameAndVersionOrFail(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);

		if (await this.fileExists(libraryName, filename)) {
			return false;
		}

		let size = 0;
		const filepath = this.getFilePath(libraryName, filename);

		try {
			await this.s3Client.create(
				filepath,
				new FileDto({
					name: filepath,
					mimeType: 'application/octet-stream',
					data: dataStream,
				})
			);
			size = (await this.s3Client.head(filepath)).ContentLength ?? 0;
		} catch (error) {
			return false;
		}

		library.files.push({ name: filename, birthtime: new Date(), size });
		await this.libraryRepo.save(library);

		return true;
	}

	/**
	 * Adds the metadata of the library
	 * @param libraryMetadata
	 * @param restricted
	 * @returns The newly created library object
	 */
	public async addLibrary(libMeta: ILibraryMetadata, restricted: boolean): Promise<IInstalledLibrary> {
		const existingLibrary = await this.libraryRepo.findByNameAndExactVersion(
			libMeta.machineName,
			libMeta.majorVersion,
			libMeta.minorVersion,
			libMeta.patchVersion
		);

		if (existingLibrary !== null) {
			throw new Error("Can't add library because it already exists");
		}

		const library = new InstalledLibrary(
			libMeta.machineName,
			libMeta.majorVersion,
			libMeta.minorVersion,
			libMeta.patchVersion,
			restricted,
			libMeta.runnable,
			libMeta.title,
			undefined,
			libMeta.addTo,
			libMeta.author,
			libMeta.coreApi,
			libMeta.description,
			libMeta.dropLibraryCss,
			libMeta.dynamicDependencies,
			libMeta.editorDependencies,
			libMeta.embedTypes,
			libMeta.fullscreen,
			libMeta.h,
			libMeta.license,
			libMeta.metadataSettings,
			libMeta.preloadedCss,
			libMeta.preloadedDependencies,
			libMeta.preloadedJs,
			libMeta.w,
			libMeta.requiredExtensions,
			libMeta.state
		);

		await this.libraryRepo.createLibrary(library);

		return library;
	}

	/**
	 * Removes all files of a library, but keeps the metadata
	 * @param library
	 */
	public async clearFiles(libraryName: ILibraryName): Promise<void> {
		const library = await this.libraryRepo.findOneByNameAndVersionOrFail(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);

		await this.s3Client.delete(library.files.map((file) => this.getFilePath(library, file.name)));
	}

	/**
	 * Deletes metadata and all files of the library
	 * @param library
	 */
	public async deleteLibrary(libraryName: ILibraryName): Promise<void> {
		const library = await this.libraryRepo.findOneByNameAndVersionOrFail(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);

		await this.s3Client.delete(library.files.map((file) => this.getFilePath(library, file.name)));
		await this.libraryRepo.delete(library);
	}

	public async getFileMetadata(libraryName: ILibraryName, filename: string): Promise<FileMetadata> {
		const library = await this.libraryRepo.findOneByNameAndVersionOrFail(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);
		for (const file of library.files) {
			if (file.name === filename) {
				return file;
			}
		}
		throw new Error('File does not exist');
	}

	/**
	 * Checks if the file exists in the library
	 * @param library
	 * @param filename
	 * @returns true if the file exists, false otherwise
	 */
	public async fileExists(libraryName: ILibraryName, filename: string): Promise<boolean> {
		try {
			await this.getFileMetadata(libraryName, filename);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Counts how often libraries are listed in the dependencies of other libraries and returns a list of the number.
	 * @returns an object with ubernames as key.
	 */
	public async getAllDependentsCount(): Promise<{ [ubername: string]: number }> {
		const libraries = await this.libraryRepo.getAll();
		const libraryMap = new Map(libraries.map((library) => [LibraryName.toUberName(library), library]));

		// Remove circular dependencies
		for (const library of libraries) {
			for (const dependency of library.editorDependencies ?? []) {
				const ubername = LibraryName.toUberName(dependency);

				const dependencyMetadata = libraryMap.get(ubername);

				if (dependencyMetadata?.preloadedDependencies) {
					const index = dependencyMetadata.preloadedDependencies.findIndex((libName) =>
						LibraryName.equal(libName, library)
					);

					if (index >= 0) {
						dependencyMetadata.preloadedDependencies.splice(index, 1);
					}
				}
			}
		}

		// Count dependencies
		const dependencies: { [ubername: string]: number } = {};
		for (const library of libraries) {
			const { preloadedDependencies = [], editorDependencies = [], dynamicDependencies = [] } = library;

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
	public async getFileAsJson(library: ILibraryName, file: string): Promise<any> {
		const content = await this.getFileAsString(library, file);
		return JSON.parse(content) as unknown;
	}

	/**
	 * Returns the file as a utf-8 string
	 * @param library
	 * @param file
	 */
	public async getFileAsString(library: ILibraryName, file: string): Promise<string> {
		const response = await this.s3Client.get(this.getFilePath(library, file));
		const chunks: Buffer[] = [];
		for await (const chunk of response.data) {
			chunks.push(Buffer.from(chunk as Buffer));
		}
		return Buffer.concat(chunks).toString('utf-8');
	}

	/**
	 * Returns information about a library file
	 * @param library
	 * @param file
	 */
	public async getFileStats(libraryName: ILibraryName, file: string): Promise<IFileStats> {
		return this.getFileMetadata(libraryName, file);
	}

	/**
	 * Returns a readable stream of the file's contents.
	 * @param library
	 * @param file
	 */
	public async getFileStream(library: ILibraryName, file: string): Promise<Readable> {
		const response = await this.s3Client.get(this.getFilePath(library, file));
		return response.data;
	}

	/**
	 * Lists all installed libraries or the installed libraries that have the machine name
	 * @param machineName (optional) only return libraries that have this machine name
	 */
	public async getInstalledLibraryNames(machineName?: string): Promise<ILibraryName[]> {
		if (machineName) {
			return this.libraryRepo.findByName(machineName);
		}
		return this.libraryRepo.getAll();
	}

	/**
	 * Lists all languages supported by a library
	 * @param library
	 */
	public async getLanguages(libraryName: ILibraryName): Promise<string[]> {
		const library = await this.libraryRepo.findOneByNameAndVersionOrFail(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);

		const languages: string[] = [];
		for (const file of library.files) {
			if (file.name.startsWith('language') && file.name.endsWith('.json')) {
				languages.push(path.basename(file.name, '.json'));
			}
		}

		return languages;
	}

	/**
	 * Returns the library metadata
	 * @param library
	 */
	public async getLibrary(library: ILibraryName): Promise<InstalledLibrary> {
		return this.libraryRepo.findOneByNameAndVersionOrFail(
			library.machineName,
			library.majorVersion,
			library.minorVersion
		);
	}

	/**
	 * Checks if a library is installed
	 * @param library
	 */
	public async isInstalled(libraryName: ILibraryName): Promise<boolean> {
		const library = await this.libraryRepo.findNewestByNameAndVersion(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);
		return library !== null;
	}

	/**
	 * Lists all addons that are installed in the system.
	 */
	public async listAddons(): Promise<ILibraryMetadata[]> {
		const installedLibraryNames = await this.getInstalledLibraryNames();
		console.log(installedLibraryNames);
		const installedLibraries = await Promise.all(installedLibraryNames.map((addonName) => this.getLibrary(addonName)));
		console.log(installedLibraries);
		const addons = installedLibraries.filter((library) => library.addTo !== undefined);
		console.log(addons);

		return addons;
	}

	/**
	 * Returns all files that are a part of the library
	 * @param library
	 * @returns an array of filenames
	 */
	public async listFiles(libraryName: ILibraryName): Promise<string[]> {
		const library = await this.libraryRepo.findOneByNameAndVersionOrFail(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);
		return library.files.map((file) => file.name);
	}

	/**
	 * Updates the additional metadata properties that are added to the stored libraries.
	 * @param library
	 * @param additionalMetadata
	 */
	public async updateAdditionalMetadata(
		libraryName: ILibraryName,
		additionalMetadata: Partial<IAdditionalLibraryMetadata>
	): Promise<boolean> {
		const library = await this.getLibrary(libraryName);

		let dirty = false;
		for (const [property, value] of Object.entries(additionalMetadata)) {
			if (value !== library[property]) {
				library[property] = value;
				dirty = true;
			}
		}

		// Don't write file if nothing has changed
		if (!dirty) {
			return false;
		}

		await this.libraryRepo.save(library);

		return true;
	}

	/**
	 * Updates the library metadata
	 * @param libraryMetadata
	 */
	async updateLibrary(library: ILibraryMetadata): Promise<IInstalledLibrary> {
		const existingLibrary = await this.libraryRepo.findOneByNameAndVersionOrFail(
			library.machineName,
			library.majorVersion,
			library.minorVersion
		);
		let dirty = false;
		for (const [property, value] of Object.entries(library)) {
			if (property !== '_id' && value !== existingLibrary[property]) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				existingLibrary[property] = value;
				dirty = true;
			}
		}
		if (dirty) {
			await this.libraryRepo.save(existingLibrary);
		}

		return existingLibrary;
	}
}
