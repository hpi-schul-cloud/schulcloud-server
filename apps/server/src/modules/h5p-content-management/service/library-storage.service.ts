import { S3ClientAdapter } from '@infra/s3-client';
import {
	H5pError,
	type IAdditionalLibraryMetadata,
	type IFileStats,
	type IInstalledLibrary,
	type ILibraryMetadata,
	type ILibraryName,
	type ILibraryStorage,
	LibraryName,
	streamToString,
} from '@lumieducation/h5p-server';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import mime from 'mime';
import path from 'node:path/posix';
import pLimit from 'p-limit';
import { Readable } from 'stream';
import { H5pFileDto } from '../controller/dto';
import { H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../h5p-editor.const';
import { InstalledLibrary, LibraryRepo } from '../repo';

enum LibraryDependencyType {
	PreloadedDependencies = 'preloadedDependencies',
	EditorDependencies = 'editorDependencies',
	DynamicDependencies = 'dynamicDependencies',
}

@Injectable()
export class LibraryStorage implements ILibraryStorage {
	public promiseLimiter = pLimit(40);

	/**
	 * @param libraryRepo
	 * @param s3Client
	 */
	constructor(
		private readonly libraryRepo: LibraryRepo,
		@Inject(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN) private readonly s3Client: S3ClientAdapter
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

	private getS3Key(library: ILibraryName, filename: string): string {
		const uberName = LibraryName.toUberName(library);
		const s3Key = `h5p-libraries/${uberName}/${filename}`;

		return s3Key;
	}

	/**
	 * Adds a file to a library. Library metadata must be installed using `installLibrary` first.
	 * @param libraryName
	 * @param filename
	 * @param dataStream
	 * @returns true if successful
	 */
	public async addFile(libraryName: ILibraryName, filename: string, dataStream: Readable): Promise<boolean> {
		this.checkFilename(filename);

		const s3Path = this.getS3Key(libraryName, filename);

		await this.promiseLimiter(() =>
			this.s3Client.create(
				s3Path,
				new H5pFileDto({
					name: s3Path,
					mimeType: 'application/octet-stream',
					data: dataStream,
				})
			)
		);

		return true;
	}

	/**
	 * Adds the metadata of the library
	 * @param libMeta
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
			throw new ConflictException("Can't add library because it already exists");
		}

		const library = new InstalledLibrary(libMeta, restricted, undefined);

		await this.libraryRepo.createLibrary(library);

		return library;
	}

	/**
	 * Removes all files of a library, but keeps the metadata
	 * @param libraryName
	 */
	public async clearFiles(libraryName: ILibraryName): Promise<void> {
		const isInstalled = await this.isInstalled(libraryName);

		if (!isInstalled) {
			throw new H5pError('mongo-s3-library-storage:clear-library-not-found', {
				ubername: LibraryName.toUberName(libraryName),
			});
		}

		await this.deleteFolder(libraryName);
	}

	public async deleteFolder(libraryName: ILibraryName): Promise<void> {
		const s3Path = this.getS3Key(libraryName, '');
		await this.s3Client.deleteDirectory(s3Path);
	}

	/**
	 * Deletes metadata and all files of the library
	 * @param libraryName
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
	 * @param libraryName
	 * @param filename
	 * @returns true if the file exists, false otherwise
	 */
	public async fileExists(libraryName: ILibraryName, filename: string): Promise<boolean> {
		this.checkFilename(filename);

		try {
			const s3Path = this.getS3Key(libraryName, filename);
			await this.s3Client.head(s3Path);

			return true;
		} catch {
			return false;
		}
	}

	private removeCircularDependencies(libraries: ILibraryMetadata[]): void {
		const libraryEntries = libraries.map<[string, ILibraryMetadata]>((library) => [
			LibraryName.toUberName(library),
			library,
		]);
		const libraryMap = new Map<string, ILibraryMetadata>(libraryEntries);

		for (const library of libraries) {
			const queue: ILibraryMetadata[] = [library];

			while (queue.length > 0) {
				const currentLibrary = queue.shift();
				if (currentLibrary !== undefined) {
					this.removeCircularDependenciesForSingleLibraryOfType(
						LibraryDependencyType.PreloadedDependencies,
						currentLibrary,
						libraryMap,
						queue
					);
					this.removeCircularDependenciesForSingleLibraryOfType(
						LibraryDependencyType.EditorDependencies,
						currentLibrary,
						libraryMap,
						queue
					);
					this.removeCircularDependenciesForSingleLibraryOfType(
						LibraryDependencyType.DynamicDependencies,
						currentLibrary,
						libraryMap,
						queue
					);
				}
			}
		}
	}

	private removeCircularDependenciesForSingleLibraryOfType(
		procssingType: LibraryDependencyType,
		currentLibrary: ILibraryMetadata,
		libraryMap: Map<string, ILibraryMetadata>,
		queue: ILibraryMetadata[]
	): void {
		for (const dependency of currentLibrary[procssingType] ?? []) {
			const ubername = LibraryName.toUberName(dependency);
			const dependencyMetadata = libraryMap.get(ubername);

			if (dependencyMetadata) {
				this.removeDependencyReferenceForCurrentType(
					LibraryDependencyType.PreloadedDependencies,
					dependencyMetadata,
					currentLibrary
				);
				this.removeDependencyReferenceForCurrentType(
					LibraryDependencyType.EditorDependencies,
					dependencyMetadata,
					currentLibrary
				);
				this.removeDependencyReferenceForCurrentType(
					LibraryDependencyType.DynamicDependencies,
					dependencyMetadata,
					currentLibrary
				);

				queue.push(dependencyMetadata);
			}
		}
	}

	private removeDependencyReferenceForCurrentType(
		processingType: LibraryDependencyType,
		dependencyMetadata: ILibraryMetadata,
		currentLibrary: ILibraryMetadata
	): void {
		const currentDependencies = dependencyMetadata[processingType];
		if (currentDependencies) {
			const index = currentDependencies.findIndex((libName) => LibraryName.equal(libName, currentLibrary));

			if (index >= 0) {
				currentDependencies.splice(index, 1);
			}
		}
	}

	/**
	 * Counts how often libraries are listed in the dependencies of other libraries and returns a list of the number.
	 * @returns an object with ubernames as key.
	 */
	public async getAllDependentsCount(): Promise<{ [ubername: string]: number }> {
		const libraries = await this.libraryRepo.getAll();

		this.removeCircularDependencies(libraries);

		// Count dependencies
		const dependencyCounts: { [ubername: string]: number } = {};
		for (const library of libraries) {
			const { preloadedDependencies = [], editorDependencies = [], dynamicDependencies = [] } = library;
			const softDependencies = await this.getSoftDependenciesFromSemantics(library);

			const dependencies = preloadedDependencies.concat(editorDependencies, dynamicDependencies, softDependencies);
			for (const dependency of dependencies) {
				const ubername = LibraryName.toUberName(dependency);
				dependencyCounts[ubername] = (dependencyCounts[ubername] ?? 0) + 1;
			}
		}

		return dependencyCounts;
	}

	private async getSoftDependenciesFromSemantics(library: ILibraryMetadata): Promise<ILibraryName[]> {
		const softDependencies: LibraryName[] = [];

		const semanticsFileExists = await this.fileExists(library, 'semantics.json');
		if (semanticsFileExists) {
			const semantics = await this.getFileAsJson(library, 'semantics.json', true);
			if (Array.isArray(semantics)) {
				const libraryOptions = this.findLibraryOptions(semantics);
				for (const libraryOption of libraryOptions) {
					const libraryName = LibraryName.fromUberName(libraryOption, { useWhitespace: true, useHyphen: false });
					softDependencies.push(libraryName);
				}
			}
		}

		return softDependencies;
	}

	private findLibraryOptions(semantics: any[]): string[] {
		const results: string[] = [];

		function search(obj: any): void {
			if (obj && typeof obj === 'object') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if ('type' in obj && obj.type && obj.type === 'library' && 'options' in obj && Array.isArray(obj.options)) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
					results.push(...obj.options);
				}
				for (const key in obj) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					const value = obj[key];
					if (Array.isArray(value)) {
						value.forEach(search);
					} else if (typeof value === 'object' && value !== null) {
						search(value);
					}
				}
			}
		}

		semantics.forEach(search);

		return results;
	}

	/**
	 * Counts how many dependents the library has.
	 * @param library
	 * @returns the count
	 */
	public async getDependentsCount(library: ILibraryName): Promise<number> {
		const dependencyCounts = await this.getAllDependentsCount();

		return dependencyCounts[LibraryName.toUberName(library)] ?? 0;
	}

	/**
	 * Returns the file as a JSON-parsed object
	 * @param library
	 * @param file
	 */
	public async getFileAsJson(library: ILibraryName, file: string, readLibraryJsonFromS3 = false): Promise<unknown> {
		const content = await this.getFileAsString(library, file, readLibraryJsonFromS3);
		const json = JSON.parse(content) as unknown;

		return json;
	}

	/**
	 * Returns the file as a utf-8 string
	 * @param library
	 * @param file
	 */
	public async getFileAsString(library: ILibraryName, file: string, readLibraryJsonFromS3 = false): Promise<string> {
		const stream = await this.getFileStream(library, file, readLibraryJsonFromS3);
		const data = await streamToString(stream);

		return data;
	}

	/**
	 * Returns information about a library file
	 * @param libraryName
	 * @param file
	 */
	public async getFileStats(libraryName: ILibraryName, file: string): Promise<IFileStats> {
		this.checkFilename(file);

		const s3Path = this.getS3Key(libraryName, file);
		const head = await this.s3Client.head(s3Path);

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
	public async getFileStream(library: ILibraryName, file: string, readLibraryJsonFromS3 = false): Promise<Readable> {
		const ubername = LibraryName.toUberName(library);

		const response = await this.getLibraryFile(ubername, file, readLibraryJsonFromS3);

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
	 * @param libraryName
	 */
	public async getLanguages(libraryName: ILibraryName): Promise<string[]> {
		const s3Path = this.getS3Key(libraryName, 'language');

		const { files } = await this.s3Client.list({ path: s3Path });

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
	 * @param libraryName
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
	 * @param libraryName
	 * @param withMetadata wether to include metadata file
	 * @returns an array of filenames
	 */
	public async listFiles(libraryName: ILibraryName, withMetadata = true): Promise<string[]> {
		const s3Path = this.getS3Key(libraryName, '');

		const { files } = await this.s3Client.list({ path: s3Path });

		if (withMetadata) {
			return files.concat('library.json');
		}

		return files;
	}

	/**
	 * Updates the additional metadata properties that are added to the stored libraries.
	 * @param libraryName
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
	 * @param library
	 */
	public async updateLibrary(library: ILibraryMetadata): Promise<IInstalledLibrary> {
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
	 * @param fileName file name
	 * @returns a readable stream, mimetype and size
	 */
	public async getLibraryFile(
		ubername: string,
		fileName: string,
		readLibraryJsonFromS3 = false
	): Promise<{
		stream: Readable;
		mimetype: string;
		size?: number;
	}> {
		const libraryName = LibraryName.fromUberName(ubername);

		this.checkFilename(fileName);

		let result: { stream: Readable | never; mimetype: string; size: number | undefined } | null = null;

		if (fileName === 'library.json' && !readLibraryJsonFromS3) {
			const metadata = await this.getMetadata(libraryName);
			const stringifiedMetadata = JSON.stringify(metadata);
			const readable = Readable.from(stringifiedMetadata);

			result = {
				stream: readable,
				mimetype: 'application/json',
				size: stringifiedMetadata.length,
			};
		} else {
			const s3Path = this.getS3Key(libraryName, fileName);
			const response = await this.s3Client.get(s3Path);
			const mimetype = mime.lookup(fileName, 'application/octet-stream');

			result = {
				stream: response.data,
				mimetype,
				size: response.contentLength,
			};
		}

		return result;
	}

	/**
	 * Retrieves all folders in the S3 bucket under the h5p-libraries prefix.
	 * @returns an array of folder names
	 */
	public async getAllLibraryFolders(): Promise<string[]> {
		const prefix = 'h5p-libraries/';
		const { files } = await this.s3Client.list({ path: prefix });
		const result = this.extractUniqueFolderNamesFromFilePaths(files);

		return result;
	}

	private extractUniqueFolderNamesFromFilePaths(files: string[]): string[] {
		const folders = new Set<string>();
		for (const filePath of files) {
			const parts = filePath.split('/');
			const filePathHasFolder = parts.length > 1;
			if (filePathHasFolder) {
				folders.add(parts[0]);
			}
		}
		const result = Array.from(folders);

		return result;
	}
}
