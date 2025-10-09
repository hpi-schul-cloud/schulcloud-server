const AdmZip = require('adm-zip');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('yaml');

class FileSystemHelper {
	static getAllFolders(dirPath) {
		if (!this.pathExists(dirPath)) {
			throw new Error(`Path does not exist: ${dirPath}`);
		}
		const result = fs
			.readdirSync(dirPath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		return result;
	}

	static getAllFilesAndFolders(dirPath) {
		if (!this.pathExists(dirPath)) {
			throw new Error(`Path does not exist: ${dirPath}`);
		}
		const result = fs.readdirSync(dirPath, { withFileTypes: true });

		return result;
	}

	static pathExists(path) {
		const result = fs.existsSync(path);

		return result;
	}

	static readJsonFile(filePath) {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
		const json = JSON.parse(content);

		return json;
	}

	static readFile(filePath) {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });

		return content;
	}

	static readLibraryRepoMap = (mapFile) => {
		const libraryRepoMap = this.readYamlFile(mapFile);

		if (!this.isLibraryRepoMapType(libraryRepoMap)) {
			throw new Error('Invalid input type for library repo map');
		}

		return libraryRepoMap;
	};

	static isLibraryRepoMapType = (object) => {
		const isType =
			typeof object === 'object' &&
			object !== null &&
			!Array.isArray(object) &&
			Object.values(object).every((v) => typeof v === 'string');

		return isType;
	};

	static readLibraryWishList(filePath) {
		const librariesYamlContent = this.readYamlFile(filePath);

		if (!this.isLibrariesContentType(librariesYamlContent)) {
			throw new Error('Invalid input type for library wish list');
		}

		const libraryWishList = librariesYamlContent.h5p_libraries;

		return libraryWishList;
	}

	static isLibrariesContentType = (object) => {
		const isType =
			typeof object === 'object' &&
			!Array.isArray(object) &&
			object !== null &&
			'h5p_libraries' in object &&
			Array.isArray(object.h5p_libraries);

		return isType;
	};

	static readYamlFile(filePath) {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
		const yamlContent = yaml.parse(content);

		return yamlContent;
	}

	static writeJsonFile(filePath, json) {
		fs.writeFileSync(filePath, JSON.stringify(json, null, 2), { encoding: 'utf-8' });
	}

	static writeLibraryRepoMap(filePath, machineNameToRepoMap) {
		const sorted = Object.keys(machineNameToRepoMap)
			.sort()
			.reduce((acc, key) => {
				acc[key] = machineNameToRepoMap[key];

				return acc;
			}, {});
		const yamlContent = yaml.stringify(sorted);
		fs.writeFileSync(filePath, yamlContent, { encoding: 'utf-8' });
	}

	static removeTemporaryFiles(filePath, folderPath) {
		this.removeFile(filePath);
		this.removeFolder(folderPath);
	}

	static removeFile(filePath) {
		fs.rmSync(filePath, { force: true });
	}

	static removeFolder(folderPath) {
		fs.rmSync(folderPath, { recursive: true, force: true });
	}

	static unzipFile(zipFilePath, outputDir) {
		const zip = new AdmZip(zipFilePath);
		zip.extractAllTo(outputDir, true);
	}

	static getTempDir() {
		const tempDir = os.tmpdir();

		return tempDir;
	}

	static createTempFolder(tempFolder, library, tag) {
		const filePath = path.join(tempFolder, `${library}-${tag}.zip`);

		const [tagMajor, tagMinor] = tag.split('.');
		const folderPath = path.join(tempFolder, `${library}-${tagMajor}.${tagMinor}`);

		return { filePath, folderPath, tempFolder };
	}

	static createFolder(folderPath) {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	static getLibraryJsonPath(folderPath) {
		return this.buildPath(folderPath, 'library.json');
	}

	static getSemanticsJsonPath(folderPath) {
		return this.buildPath(folderPath, 'semantics.json');
	}

	static checkPackageJsonPath(folderPath) {
		const packageJsonPath = this.buildPath(folderPath, 'package.json');

		return this.pathExists(packageJsonPath);
	}

	static buildPath(...segments) {
		return path.join(...segments);
	}

	static unzipAndRenameFolder(filePath, folderPath, tempFolder, repo, tag) {
		this.unzipFile(filePath, tempFolder);
		this.renameFolder(folderPath, tempFolder, repo, tag);
	}

	static renameFolder(folderPath, tempFolder, repo, tag) {
		const repoName = repo.split('/')[1];
		const repoNameFolder = path.join(tempFolder, `${repoName}-${tag}`);
		if (repoNameFolder === folderPath) {
			return;
		}

		if (!this.pathExists(repoNameFolder)) {
			throw new Error(`Repository folder ${repo} does not exist in temporary folder.`);
		}

		if (this.pathExists(folderPath)) {
			this.removeFolder(folderPath);
		}

		fs.renameSync(repoNameFolder, folderPath);
	}

	static getStatsOfPath(filePath) {
		return fs.statSync(filePath);
	}
}

module.exports = FileSystemHelper;
