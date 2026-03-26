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

		const tempDir = FileSystemHelper.getTempDir();
		const h5pHubFolder = FileSystemHelper.buildPath(tempDir, 'h5p-hub');
		if (!FileSystemHelper.pathExists(h5pHubFolder)) {
			this.logger.debug(`Creating H5P Hub folder`);
			FileSystemHelper.createFolder(h5pHubFolder);
		}

		const filePath = FileSystemHelper.buildPath(h5pHubFolder, `${library}.h5p`);
		if (FileSystemHelper.pathExists(filePath)) {
			this.logger.debug(`Removing existing H5P Hub file`);
			FileSystemHelper.removeFile(filePath);
		}

		this.logger.debug(`Downloading ${library} from H5P Hub...`);
		await this.downloadContentType(library, filePath);

		this.logger.debug(`Unzipping H5P Hub file for ${library}`);
		const outputDir = FileSystemHelper.buildPath(h5pHubFolder, library);
		if (FileSystemHelper.pathExists(outputDir)) {
			this.logger.debug(`Removing existing H5P Hub folder`);
			FileSystemHelper.removeFolder(outputDir);
		}
		FileSystemHelper.unzipFile(filePath, outputDir);

		const folders = FileSystemHelper.getAllFolders(outputDir);
		const folder = folders.find((f) => f.startsWith(library));
		if (!folder) {
			throw new Error(`No folder found for library ${library} in unzipped H5P Hub content.`);
		}

		const libraryFolder = FileSystemHelper.buildPath(outputDir, folder);
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(libraryFolder);
		const json = FileSystemHelper.readLibraryJson(libraryJsonPath);
		const version: IFullLibraryName = {
			machineName: library,
			majorVersion: json.majorVersion,
			minorVersion: json.minorVersion,
			patchVersion: json.patchVersion,
		};

		this.logger.debug(`Found Hub version: ${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`);

		this.versionCache.set(library, version);

		return version;
	}

	public clearVersionCache(): void {
		this.versionCache = new Map();
	}
}
