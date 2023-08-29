import {
	H5pError,
	LibraryName,
	streamToString,
	type IAdditionalLibraryMetadata,
	type IFileStats,
	type IInstalledLibrary,
	type ILibraryMetadata,
	type ILibraryName,
	type ILibraryStorage,
} from '@lumieducation/h5p-server';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { FileDto } from '@src/modules/files-storage/dto';
import mime from 'mime';
import path from 'node:path/posix';
import { Readable } from 'stream';
import { InstalledLibrary } from '../entity/library.entity';
import { LibraryRepo } from '../repo/library.repo';

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
		const hasPathTraversal = /\.\.\//.test(filename);
		const isAbsolutePath = filename.startsWith('/');

		if (hasPathTraversal || isAbsolutePath) {
			throw new H5pError('illegal-filename', { filename }, 400);
		}
	}

	private getS3Key(library: ILibraryName, filename: string) {
		const uberName = LibraryName.toUberName(library);
		const s3Key = `h5p-libraries/${uberName}/${filename}`;

		return s3Key;
	}

	/**
	 * Adds a file to a library. Library metadata must be installed using `installLibrary` first.
	 * @param library
	 * @param filename
	 * @param dataStream
	 * @returns true if successful
	 */
	public async addFile(libraryName: ILibraryName, filename: string, dataStream: Readable): Promise<boolean> {
		this.checkFilename(filename);

		const s3Key = this.getS3Key(libraryName, filename);

		try {
			await this.s3Client.create(
				s3Key,
				new FileDto({
					name: s3Key,
					mimeType: 'application/octet-stream',
					data: dataStream,
				})
			);
		} catch (error) {
			throw new H5pError(
				`mongo-s3-library-storage:s3-upload-error`,
				{ ubername: LibraryName.toUberName(libraryName), filename },
				500
			);
		}

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

		const library = new InstalledLibrary(libMeta, restricted, undefined);

		await this.libraryRepo.createLibrary(library);

		return library;
	}

	/**
	 * Removes all files of a library, but keeps the metadata
	 * @param library
	 */
	public async clearFiles(libraryName: ILibraryName): Promise<void> {
		const isInstalled = await this.isInstalled(libraryName);

		if (!isInstalled) {
			throw new H5pError('mongo-s3-library-storage:clear-library-not-found', {
				ubername: LibraryName.toUberName(libraryName),
			});
		}

		const filesToDelete = await this.listFiles(libraryName, false);

		await this.s3Client.delete(filesToDelete.map((file) => this.getS3Key(libraryName, file)));
	}

	/**
	 * Deletes metadata and all files of the library
	 * @param library
	 */
	public async deleteLibrary(libraryName: ILibraryName): Promise<void> {
		const isInstalled = await this.isInstalled(libraryName);

		if (!isInstalled) {
			throw new H5pError('mongo-s3-library-storage:library-not-found');
		}

		await this.clearFiles(libraryName);

		const library = await this.libraryRepo.findOneByNameAndVersionOrFail(
			libraryName.machineName,
			libraryName.majorVersion,
			libraryName.minorVersion
		);

		await this.libraryRepo.delete(library);
	}

	/**
	 * Checks if the file exists in the library
	 * @param library
	 * @param filename
	 * @returns true if the file exists, false otherwise
	 */
	public async fileExists(libraryName: ILibraryName, filename: string): Promise<boolean> {
		this.checkFilename(filename);

		try {
			await this.s3Client.head(this.getS3Key(libraryName, filename));
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
		const stream = await this.getFileStream(library, file);
		const data = await streamToString(stream);
		return data;
	}

	/**
	 * Returns information about a library file
	 * @param library
	 * @param file
	 */
	public async getFileStats(libraryName: ILibraryName, file: string): Promise<IFileStats> {
		this.checkFilename(file);

		const s3Key = this.getS3Key(libraryName, file);
		const head = await this.s3Client.head(s3Key);

		if (head.LastModified === undefined || head.ContentLength === undefined) {
			throw new NotFoundException();
		}

		return {
			birthtime: head.LastModified,
			size: head.ContentLength,
		};
	}

	/**
	 * Returns a readable stream of the file's contents.
	 * @param library
	 * @param file
	 */
	public async getFileStream(library: ILibraryName, file: string): Promise<Readable> {
		const ubername = LibraryName.toUberName(library);

		const response = await this.getLibraryFile(ubername, file);

		return response.stream;
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
		const prefix = this.getS3Key(libraryName, 'language');

		const files = await this.s3Client.list(prefix);

		const jsonFiles = files.filter((file) => path.extname(file) === '.json');
		const languages = jsonFiles.map((file) => path.basename(file, '.json'));

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
		const installedLibraries = await Promise.all(installedLibraryNames.map((addonName) => this.getLibrary(addonName)));
		const addons = installedLibraries.filter((library) => library.addTo !== undefined);

		return addons;
	}

	/**
	 * Returns all files that are a part of the library
	 * @param library
	 * @param withMetadata wether to include metadata file
	 * @returns an array of filenames
	 */
	public async listFiles(libraryName: ILibraryName, withMetadata = true): Promise<string[]> {
		const files = await this.s3Client.list(this.getS3Key(libraryName, ''));

		if (withMetadata) {
			return files.concat('library.json');
		}

		return files;
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

	private async getMetadata(library: ILibraryName): Promise<ILibraryMetadata> {
		if (!library) {
			throw new Error('You must pass in a library name to getLibrary.');
		}

		const result = await this.libraryRepo.findOneByNameAndVersionOrFail(
			library.machineName,
			library.majorVersion,
			library.minorVersion
		);

		return result;
	}

	/**
	 * Returns a file from a library
	 * @param ubername Library ubername
	 * @param file file
	 * @returns a readable stream, mimetype and size
	 */
	public async getLibraryFile(ubername: string, file: string) {
		const libraryName = LibraryName.fromUberName(ubername);

		this.checkFilename(file);

		if (file === 'library.json') {
			const metadata = JSON.stringify(await this.getMetadata(libraryName));
			const readable = Readable.from(metadata);

			return {
				stream: readable,
				mimetype: 'application/json',
				size: metadata.length,
			};
		}

		const response = await this.s3Client.get(this.getS3Key(libraryName, file));

		const mimetype = mime.lookup(file, 'application/octet-stream');

		return {
			stream: response.data,
			mimetype,
			size: response.contentLength,
		};
	}
}
