import { IFullLibraryName } from '@lumieducation/h5p-server/build/src/types';
import { FileSystemHelper } from '../helper/file-system.helper';
import { S3ClientHelper } from '../helper/s3-client.helper';
import { H5PLibrary } from '../interface/h5p-library';

type VersionUpdate = {
	newVersion: IFullLibraryName;
	oldVersion: IFullLibraryName;
};

export class H5pLibraryUploaderService {
	tempFolderPath: string;
	s3ClientHelper: S3ClientHelper;

	constructor(tempFolderPath?: string) {
		if (!tempFolderPath) {
			const tempDir = FileSystemHelper.getTempDir();
			this.tempFolderPath = FileSystemHelper.buildPath(tempDir, 'h5p-libraries');
		} else {
			this.tempFolderPath = tempFolderPath;
		}
		if (!FileSystemHelper.pathExists(this.tempFolderPath)) {
			throw new Error(`Temporary folder ${this.tempFolderPath} does not exist.`);
		}
		this.s3ClientHelper = new S3ClientHelper();
	}

	public async uploadLibraries(): Promise<void> {
		const folders: string[] = FileSystemHelper.getAllFolders(this.tempFolderPath);
		console.log(`Found ${folders.length} folders in the temporary directory.`);
		for (const folder of folders) {
			this.logFolderBanner(folder);
			await this.uploadLibrary(folder);
		}
	}

	private logFolderBanner(folderName: string): void {
		const name = `*   ${folderName}   *`;
		const border = '*'.repeat(name.length);
		console.log(border);
		console.log(name);
		console.log(border);
	}

	private async uploadLibrary(folderName: string): Promise<void> {
		const localFolderPath = FileSystemHelper.buildPath(this.tempFolderPath, folderName);
		if (!FileSystemHelper.pathExists(localFolderPath)) {
			throw new Error(`Folder ${localFolderPath} does not exist.`);
		}
		const s3FolderPath = this.buildS3FolderPath(folderName);
		const folderExistsInS3 = await this.checkFolderAlreadyExistsInS3(s3FolderPath);
		if (folderExistsInS3) {
			const isUpdateNeeded = await this.checkIfUpdateIsNeeded(localFolderPath, s3FolderPath);
			if (isUpdateNeeded) {
				await this.updateLibrary(isUpdateNeeded, localFolderPath, s3FolderPath);
				return;
			}
			console.log(`No update needed / possible for library ${folderName}.`);
			return;
		}
		await this.addLibrary(localFolderPath, s3FolderPath);
	}

	// Remove 'v' prefix from version number (e.g., "H5P.ImageJuxtaposition-v1.1" -> "H5P.ImageJuxtaposition-1.1")
	private buildS3FolderPath(folderName: string): string {
		const normalizedFolderName = folderName.replace(/-v(\d)/, '-$1');
		const s3FolderPath = `h5p-libraries/${normalizedFolderName}`;

		return s3FolderPath;
	}

	private async checkFolderAlreadyExistsInS3(s3FolderPath: string): Promise<boolean> {
		const objects = await this.s3ClientHelper.listObjects(s3FolderPath, undefined, 1);

		return Array.isArray(objects.Contents) && objects.Contents.length > 0;
	}

	private async checkIfUpdateIsNeeded(
		localFolderPath: string,
		s3FolderPath: string
	): Promise<VersionUpdate | undefined> {
		const localLibraryJson = this.getLibraryJsonFromLocalFolder(localFolderPath);
		const s3LibraryJson = await this.getLibraryJsonFromS3(s3FolderPath);
		const result = this.compareVersions(localLibraryJson, s3LibraryJson);

		return result;
	}

	private getLibraryJsonFromLocalFolder(localFolderPath: string): H5PLibrary {
		const localLibraryJsonPath = FileSystemHelper.buildPath(localFolderPath, 'library.json');
		if (!FileSystemHelper.pathExists(localLibraryJsonPath)) {
			throw new Error(`library.json does not exist in ${localFolderPath}`);
		}
		const localLibraryJson = FileSystemHelper.readJsonFile(localLibraryJsonPath) as H5PLibrary;

		return localLibraryJson;
	}

	private async getLibraryJsonFromS3(s3FolderPath: string): Promise<H5PLibrary | undefined> {
		const s3LibraryJsonKey = `${s3FolderPath}/library.json`;
		try {
			const s3LibraryContent = await this.s3ClientHelper.getFileContent(s3LibraryJsonKey);

			return JSON.parse(s3LibraryContent.toString()) as H5PLibrary;
		} catch (error: unknown) {
			if (this.isObjectWithAStringCode(error) && error.Code === 'NoSuchKey') {
				console.error(`No library.json found in S3 at ${s3LibraryJsonKey}.`);

				return undefined;
			}
			throw error;
		}
	}

	private isObjectWithAStringCode(obj: unknown): obj is { Code: string } {
		return typeof obj === 'object' && obj !== null && 'Code' in obj && typeof (obj as any).Code === 'string';
	}

	private compareVersions(
		localLibraryJson: H5PLibrary,
		s3LibraryJson: H5PLibrary | undefined
	): VersionUpdate | undefined {
		if (!s3LibraryJson) {
			return undefined;
		}

		const localVersion: IFullLibraryName = {
			machineName: localLibraryJson.machineName,
			majorVersion: localLibraryJson.majorVersion,
			minorVersion: localLibraryJson.minorVersion,
			patchVersion: localLibraryJson.patchVersion,
		};

		const s3Version: IFullLibraryName = {
			machineName: s3LibraryJson.machineName,
			majorVersion: s3LibraryJson.majorVersion,
			minorVersion: s3LibraryJson.minorVersion,
			patchVersion: s3LibraryJson.patchVersion,
		};

		const isUpdateNeeded =
			localVersion.machineName === s3Version.machineName &&
			localVersion.majorVersion === s3Version.majorVersion &&
			localVersion.minorVersion === s3Version.minorVersion &&
			localVersion.patchVersion > s3Version.patchVersion;

		const result = isUpdateNeeded
			? {
					newVersion: localVersion,
					oldVersion: s3Version,
			  }
			: undefined;

		return result;
	}

	private async updateLibrary(
		isUpdateNeeded: VersionUpdate,
		localFolderPath: string,
		s3FolderPath: string
	): Promise<void> {
		try {
			const { newVersion, oldVersion } = isUpdateNeeded;
			console.log(
				`Updating library ${localFolderPath} from version ${this.formatLibraryVersion(
					oldVersion
				)} to version ${this.formatLibraryVersion(newVersion)}`
			);
			await this.deleteFolderFromS3(s3FolderPath);
			console.log(`Deleted old version of library ${localFolderPath} from S3.`);
			await this.uploadLibraryToS3(localFolderPath, s3FolderPath);
			console.log(`Library ${localFolderPath} updated successfully in S3.`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`Failed to update library ${localFolderPath} in S3: ${message}`);
			throw error;
		}
	}

	private formatLibraryVersion(version: IFullLibraryName): string {
		if (!version) return '';

		return `${version.machineName}-${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`;
	}

	private async deleteFolderFromS3(s3FolderPath: string): Promise<void> {
		try {
			const deletedFiles = await this.s3ClientHelper.deleteFolder(s3FolderPath);
			console.log(`Deleted ${deletedFiles.length} file(s) from S3 folder ${s3FolderPath}: ${deletedFiles.join(', ')}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`Failed to delete folder ${s3FolderPath} from S3: ${message}`);
			throw error;
		}
	}

	private async addLibrary(localFolderPath: string, s3FolderPath: string): Promise<void> {
		try {
			console.log(`Adding library ${localFolderPath} to S3 at ${s3FolderPath}`);
			await this.uploadLibraryToS3(localFolderPath, s3FolderPath);
			console.log(`Library ${localFolderPath} added successfully to S3.`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`Failed to add library ${localFolderPath} to S3: ${message}`);
			throw error;
		}
	}

	private async uploadLibraryToS3(localFolderPath: string, s3FolderPath: string): Promise<void> {
		const uploadedFiles = await this.uploadFolderToS3Recursive(localFolderPath, s3FolderPath);
		console.log(`Uploaded ${uploadedFiles.length} file(s) to S3: ${uploadedFiles.join(', ')}`);
	}

	private async uploadFolderToS3Recursive(localDir: string, s3Prefix: string): Promise<string[]> {
		const filesToUpload: { fullPath: string; s3Key: string }[] = [];
		this.collectFilesForUpload(localDir, s3Prefix, filesToUpload);

		const batchSize = 10;
		const allUploadedFiles: string[] = [];

		for (let i = 0; i < filesToUpload.length; i += batchSize) {
			const batch = filesToUpload.slice(i, i + batchSize);
			const uploadPromises = batch.map(async ({ fullPath, s3Key }) => {
				const fileContent = FileSystemHelper.readFile(fullPath);
				await this.s3ClientHelper.uploadFile(s3Key, fileContent);

				return s3Key;
			});
			const uploadedKeys = await Promise.all(uploadPromises);
			allUploadedFiles.push(...uploadedKeys);
		}

		return allUploadedFiles;
	}

	private collectFilesForUpload(
		localDir: string,
		s3Prefix: string,
		filesToUpload: { fullPath: string; s3Key: string }[]
	): void {
		const entries = FileSystemHelper.getAllFilesAndFolders(localDir);
		for (const entry of entries) {
			const fullPath = FileSystemHelper.buildPath(localDir, entry.name);
			const s3Key = s3Prefix ? `${s3Prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				this.collectFilesForUpload(fullPath, s3Key, filesToUpload);
			} else if (entry.isFile()) {
				filesToUpload.push({ fullPath, s3Key });
			} else {
				// Skip symlinks and other special file types
			}
		}
	}
}
