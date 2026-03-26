import { IFullLibraryName } from '@lumieducation/h5p-server/build/src/types';
import axios, { AxiosResponse } from 'axios';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { FileSystemHelper } from '../helper/file-system.helper';
import { h5pLogger } from '../helper/h5p-logger.helper';

export class H5pHubClient {
	private versionCache: Map<string, IFullLibraryName> = new Map();
	private readonly logger = h5pLogger;

	public async downloadContentType(library: string, filePath: string): Promise<void> {
		const url = `https://api.h5p.org/v1/content-types/${library}`;

		try {
			const response = await this.fetchContentType(url);

			const writer = createWriteStream(filePath);
			response.data.pipe(writer);

			await new Promise<void>((resolve, reject) => {
				writer.on('finish', () => resolve());
				writer.on('error', (err) => reject(err));
			});

			this.logger.debug(`Downloaded content type ${library}`);
		} catch (error: unknown) {
			if (this.isObjectWithResponseStatus(error) && error.response.status === 404) {
				throw new Error(`No content type available at H5P Hub for ${library}.`);
			} else {
				throw new Error(`Unknown error fetching library.json from repository ${library}: ${error}`);
			}
		}
	}

	private async fetchContentType(url: string): Promise<AxiosResponse<Readable>> {
		const response: AxiosResponse<Readable> = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		});

		if (response.status < 200 || response.status >= 300) {
			throw new Error(`H5P Hub content type request failed with status ${response.status}`);
		}

		return response;
	}

	private isObjectWithResponseStatus(obj: unknown): obj is { response: { status: number } } {
		return (
			typeof obj === 'object' &&
			obj !== null &&
			'response' in obj &&
			typeof (obj as any).response === 'object' &&
			'status' in (obj as any).response &&
			typeof (obj as any).response.status === 'number'
		);
	}

	public async getCurrentVersion(library: string): Promise<IFullLibraryName> {
		const cached = this.versionCache.get(library);
		if (cached) {
			return cached;
		}

		const version = await this.fetchVersionFromHub(library);
		this.versionCache.set(library, version);

		return version;
	}

	private async fetchVersionFromHub(library: string): Promise<IFullLibraryName> {
		const h5pHubFolder = this.ensureH5pHubFolder();
		const h5pFilePath = await this.downloadToTempFile(library, h5pHubFolder);
		const extractedFolder = this.extractH5pPackage(library, h5pFilePath, h5pHubFolder);

		return this.extractVersionFromLibrary(library, extractedFolder);
	}

	private ensureH5pHubFolder(): string {
		const tempDir = FileSystemHelper.getTempDir();
		const h5pHubFolder = FileSystemHelper.buildPath(tempDir, 'h5p-hub');

		if (!FileSystemHelper.pathExists(h5pHubFolder)) {
			this.logger.debug(`Creating H5P Hub folder`);
			FileSystemHelper.createFolder(h5pHubFolder);
		}

		return h5pHubFolder;
	}

	private async downloadToTempFile(library: string, h5pHubFolder: string): Promise<string> {
		const filePath = FileSystemHelper.buildPath(h5pHubFolder, `${library}.h5p`);

		this.removeIfExists(filePath, 'file');

		this.logger.debug(`Downloading ${library} from H5P Hub...`);
		await this.downloadContentType(library, filePath);

		return filePath;
	}

	private extractH5pPackage(library: string, h5pFilePath: string, h5pHubFolder: string): string {
		const outputDir = FileSystemHelper.buildPath(h5pHubFolder, library);

		this.removeIfExists(outputDir, 'folder');

		this.logger.debug(`Unzipping H5P Hub file for ${library}`);
		FileSystemHelper.unzipFile(h5pFilePath, outputDir);

		return this.findLibraryFolder(library, outputDir);
	}

	private findLibraryFolder(library: string, outputDir: string): string {
		const folders = FileSystemHelper.getAllFolders(outputDir);
		const folder = folders.find((f) => f.startsWith(library));

		if (!folder) {
			throw new Error(`No folder found for library ${library} in unzipped H5P Hub content.`);
		}

		return FileSystemHelper.buildPath(outputDir, folder);
	}

	private extractVersionFromLibrary(library: string, libraryFolder: string): IFullLibraryName {
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(libraryFolder);
		const json = FileSystemHelper.readLibraryJson(libraryJsonPath);

		const version: IFullLibraryName = {
			machineName: library,
			majorVersion: json.majorVersion,
			minorVersion: json.minorVersion,
			patchVersion: json.patchVersion,
		};

		this.logger.debug(`Found Hub version: ${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`);

		return version;
	}

	private removeIfExists(path: string, type: 'file' | 'folder'): void {
		if (!FileSystemHelper.pathExists(path)) {
			return;
		}

		this.logger.debug(`Removing existing H5P Hub ${type}`);

		if (type === 'file') {
			FileSystemHelper.removeFile(path);
		} else {
			FileSystemHelper.removeFolder(path);
		}
	}

	public clearVersionCache(): void {
		this.versionCache = new Map();
	}
}
