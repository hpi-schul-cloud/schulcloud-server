import { IFullLibraryName } from '@lumieducation/h5p-server/build/src/types';
import axios, { AxiosResponse } from 'axios';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { FileSystemHelper } from '../helper/file-system.helper';

export class H5pHubClient {
	private versionCache: Map<string, IFullLibraryName | undefined> = new Map();

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

			console.log(`Downloaded content type ${library} to ${filePath}`);
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

	public async getCurrentVersion(library: string): Promise<IFullLibraryName | undefined> {
		if (this.versionCache.has(library)) {
			return this.versionCache.get(library);
		}

		const tempDir = FileSystemHelper.getTempDir();
		const h5pHubFolder = FileSystemHelper.buildPath(tempDir, 'h5p-hub');
		if (!FileSystemHelper.pathExists(h5pHubFolder)) {
			console.log(`Creating H5P Hub folder at ${h5pHubFolder}.`);
			FileSystemHelper.createFolder(h5pHubFolder);
		}

		const filePath = FileSystemHelper.buildPath(h5pHubFolder, `${library}.h5p`);
		if (FileSystemHelper.pathExists(filePath)) {
			console.log(`Removing existing H5P Hub file at ${filePath}.`);
			FileSystemHelper.removeFile(filePath);
		}

		console.log(`Downloading current version of ${library} from H5P Hub to ${filePath}.`);
		try {
			await this.downloadContentType(library, filePath);
		} catch (error: unknown) {
			console.error(
				`Failed to download content type ${library}: ${error instanceof Error ? error.message : String(error)}`
			);
			this.versionCache.set(library, undefined);
			return undefined;
		}

		console.log(`Unzipping H5P Hub file ${filePath} to ${h5pHubFolder}.`);
		const outputDir = FileSystemHelper.buildPath(h5pHubFolder, library);
		if (FileSystemHelper.pathExists(outputDir)) {
			console.log(`Removing existing H5P Hub folder at ${outputDir}.`);
			FileSystemHelper.removeFolder(outputDir);
		}
		FileSystemHelper.unzipFile(filePath, outputDir);

		const folders = FileSystemHelper.getAllFolders(outputDir);
		const folder = folders.find((f) => f.startsWith(library));
		if (!folder) {
			console.warn(`No folder found for library ${library} in unzipped H5P Hub content.`);
			this.versionCache.set(library, undefined);
			return undefined;
		}

		const libraryFolder = FileSystemHelper.buildPath(outputDir, folder);
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(libraryFolder);
		const json = FileSystemHelper.readJsonFile(libraryJsonPath) as {
			majorVersion: number;
			minorVersion: number;
			patchVersion: number;
			[key: string]: any;
		};
		const version: IFullLibraryName = {
			machineName: library,
			majorVersion: json.majorVersion,
			minorVersion: json.minorVersion,
			patchVersion: json.patchVersion,
		};

		console.log(
			`Found current version of library from H5P Hub: ${version.machineName}-${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`
		);

		this.versionCache.set(library, version);
		return version;
	}

	public clearVersionCache(): void {
		this.versionCache = new Map();
	}
}
