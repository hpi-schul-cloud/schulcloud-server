const fileSystemHelper = require('../helper/file-system.helper.js');
const S3ClientHelper = require('../helper/s3-client.helper.js');

class H5pLibraryUploaderService {
	constructor(tempFolderPath) {
		if (!tempFolderPath) {
			const tempDir = fileSystemHelper.getTempDir();
			this.tempFolderPath = fileSystemHelper.buildPath(tempDir, 'h5p-libraries');
		} else {
			this.tempFolderPath = tempFolderPath;
		}
		if (!fileSystemHelper.pathExists(this.tempFolderPath)) {
			throw new Error(`Temporary folder ${this.tempFolderPath} does not exist.`);
		}

		this.s3ClientHelper = new S3ClientHelper();
	}

	async uploadLibraries() {
		const folders = fileSystemHelper.getAllFolders(this.tempFolderPath);
		console.log(`Found ${folders.length} folders in the temporary directory.`);

		for (const folder of folders) {
			this.logFolderBanner(folder);
			await this.uploadLibrary(folder);
		}
	}

	logFolderBanner(folderName) {
		const name = `*   ${folderName}   *`;
		const border = '*'.repeat(name.length);
		console.log(border);
		console.log(name);
		console.log(border);
	}

	async uploadLibrary(folderName) {
		const localFolderPath = fileSystemHelper.buildPath(this.tempFolderPath, folderName);
		if (!fileSystemHelper.pathExists(localFolderPath)) {
			throw new Error(`Folder ${localFolderPath} does not exist.`);
		}

		const s3FolderPath = `h5p-libraries/${folderName}`;
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

	async checkFolderAlreadyExistsInS3(s3FolderPath) {
		const objects = await this.s3ClientHelper.listObjects(s3FolderPath);
		const folderExistsInS3 = objects.length > 0;

		return folderExistsInS3;
	}

	async checkIfUpdateIsNeeded(localFolderPath, s3FolderPath) {
		const localLibraryJson = this.getLibraryJsonFromLocalFolder(localFolderPath);

		const s3LibraryJson = await this.getLibraryJsonFromS3(s3FolderPath);

		const result = this.compareVersions(localLibraryJson, s3LibraryJson);

		return result;
	}

	getLibraryJsonFromLocalFolder(localFolderPath) {
		const localLibraryJsonPath = fileSystemHelper.buildPath(localFolderPath, 'library.json');
		if (!fileSystemHelper.pathExists(localLibraryJsonPath)) {
			throw new Error(`library.json does not exist in ${localFolderPath}`);
		}
		const localLibraryJson = fileSystemHelper.readJsonFile(localLibraryJsonPath);

		return localLibraryJson;
	}

	async getLibraryJsonFromS3(s3FolderPath) {
		const s3LibraryJsonKey = `${s3FolderPath}/library.json`;
		let s3LibraryJson;
		try {
			const s3LibraryContent = await this.s3ClientHelper.getFileContent(s3LibraryJsonKey);
			s3LibraryJson = JSON.parse(s3LibraryContent.toString());
		} catch (error) {
			if (error.Code === 'NoSuchKey') {
				console.error(`No library.json found in S3 at ${s3LibraryJsonKey}.`);
				return undefined;
			}
		}

		return s3LibraryJson;
	}

	compareVersions(localLibraryJson, s3LibraryJson) {
		if (!s3LibraryJson) {
			return undefined;
		}

		const localVersion = {
			machineName: localLibraryJson.machineName,
			majorVersion: localLibraryJson.majorVersion,
			minorVersion: localLibraryJson.minorVersion,
			patchVersion: localLibraryJson.patchVersion,
		};

		const s3Version = {
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

	async updateLibrary(isUpdateNeeded, localFolderPath, s3FolderPath) {
		try {
			const { newVersion, oldVersion } = isUpdateNeeded;
			console.log(
				`Updating library ${localFolderPath} from version ${oldVersion.machineName}-${oldVersion.majorVersion}.${oldVersion.minorVersion}.${oldVersion.patchVersion} to version ${newVersion.machineName}-${newVersion.majorVersion}.${newVersion.minorVersion}.${newVersion.patchVersion}`
			);
			await this.deleteFolderFromS3(s3FolderPath);
			console.log(`Deleted old version of library ${localFolderPath} from S3.`);
			await this.uploadLibraryToS3(localFolderPath, s3FolderPath);
			console.log(`Library ${localFolderPath} updated successfully in S3.`);
		} catch (error) {
			console.error(`Failed to update library ${localFolderPath} in S3:`, error);
			throw error;
		}
	}

	async deleteFolderFromS3(s3FolderPath) {
		try {
			const deletedFiles = await this.s3ClientHelper.deleteFolder(s3FolderPath);
			console.log(`Deleted ${deletedFiles.length} file(s) from S3 folder ${s3FolderPath}: ${deletedFiles.join(', ')}`);
		} catch (error) {
			console.error(`Failed to delete folder ${s3FolderPath} from S3:`, error);
			throw error;
		}
	}

	async addLibrary(localFolderPath, s3FolderPath) {
		try {
			console.log(`Adding library ${localFolderPath} to S3 at ${s3FolderPath}`);
			await this.uploadLibraryToS3(localFolderPath, s3FolderPath);
			console.log(`Library ${localFolderPath} added successfully to S3.`);
		} catch (error) {
			console.error(`Failed to add library ${localFolderPath} to S3:`, error);
			throw error;
		}
	}

	async uploadLibraryToS3(localFolderPath, s3FolderPath) {
		try {
			const uploadedFiles = await this.uploadFolderToS3Recursive(localFolderPath, s3FolderPath);
			console.log(`Uploaded ${uploadedFiles.length} file(s) to S3: ${uploadedFiles.join(', ')}`);
		} catch (error) {
			console.error(`Failed to upload folder ${localFolderPath} to ${s3FolderPath} in S3:`, error);
			throw error;
		}
	}

	async uploadFolderToS3Recursive(localDir, s3Prefix) {
		const allUploadedFiles = [];
		const entries = fileSystemHelper.getAllFilesAndFolders(localDir);
		for (const entry of entries) {
			const fullPath = fileSystemHelper.buildPath(localDir, entry.name);
			const s3Key = s3Prefix ? `${s3Prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				const uploadedFiles = await this.uploadFolderToS3Recursive(fullPath, s3Key);
				allUploadedFiles.push(...uploadedFiles);
			} else if (entry.isFile()) {
				const fileContent = fileSystemHelper.readFile(fullPath);
				await this.s3ClientHelper.uploadFile(s3Key, fileContent);
				allUploadedFiles.push(s3Key);
			}
		}

		return allUploadedFiles;
	}
}

module.exports = H5pLibraryUploaderService;
