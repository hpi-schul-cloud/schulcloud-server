const fileSystemHelper = require('../helper/file-system.helper.js');
const S3ClientHelper = require('../helper/s3-client.helper.js');

class H5pLibraryUploaderService {
	constructor() {
		this.s3ClientHelper = new S3ClientHelper();
	}

	async uploadLibraries() {
		const tempDir = fileSystemHelper.getTempDir();
		const tempFolder = fileSystemHelper.buildPath(tempDir, 'h5p-libraries');
		const folders = fileSystemHelper.getAllFolders(tempFolder);
		console.log(`Found ${folders.length} folders in the temporary directory.`);

		for (const folder of folders) {
			this.logFolderBanner(folder);
			await this.uploadLibrary(tempFolder, folder);
			// console.log(`Successfully uploaded library from folder: ${folder}`);
		}
	}

	logFolderBanner(folderName) {
		const name = `*   ${folderName}   *`;
		const border = '*'.repeat(name.length);
		console.log(border);
		console.log(name);
		console.log(border);
	}

	async uploadLibrary(tempFolder, folderName) {
		const localFolderPath = fileSystemHelper.buildPath(tempFolder, folderName);
		if (!fileSystemHelper.pathExists(localFolderPath)) {
			throw new Error(`Folder ${localFolderPath} does not exist.`);
		}

		const s3FolderPath = `h5p-libraries/${folderName}`;
		const folderExistsInS3 = await this.checkFolderAlreadyExistsInS3(s3FolderPath);
		if (!folderExistsInS3) {
			try {
				await this.uploadFolderToS3(localFolderPath, s3FolderPath);
			} catch (error) {
				console.error(`Failed to upload folder ${localFolderPath} to ${s3FolderPath} in S3:`, error);
				throw error;
			}
		} else {
			console.log(`Folder ${s3FolderPath} already exists in S3.`);
		}
	}

	async checkFolderAlreadyExistsInS3(s3FolderPath) {
		const objects = await this.s3ClientHelper.listObjects(s3FolderPath);
		const folderExistsInS3 = objects.length > 0;

		return folderExistsInS3;
	}

	async uploadFolderToS3(folderPath, s3Folder) {
		const uploadRecursive = async (localDir, s3Prefix) => {
			const entries = fileSystemHelper.getAllFilesAndFolders(localDir);
			for (const entry of entries) {
				const fullPath = fileSystemHelper.buildPath(localDir, entry.name);
				const s3Key = s3Prefix ? `${s3Prefix}/${entry.name}` : entry.name;
				if (entry.isDirectory()) {
					await uploadRecursive(fullPath, s3Key);
				} else if (entry.isFile()) {
					const fileContent = fileSystemHelper.readFile(fullPath);
					await this.s3ClientHelper.uploadFile(s3Key, fileContent);
					console.log(`Uploaded file: ${s3Key}`);
				}
			}
		};

		await uploadRecursive(folderPath, s3Folder);
	}
}

module.exports = H5pLibraryUploaderService;
