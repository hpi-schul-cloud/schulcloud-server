const AdmZip = require('adm-zip');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('yaml');

class FileSystemHelper {
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

	static writeLibraryJson(filePath, json) {
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

	static createTempFolder(library, tag) {
		const tempFolder = os.tmpdir();
		const libraryName = library.split('/')[1];
		const filePath = path.join(tempFolder, `${libraryName}-${tag}.zip`);
		const folderPath = path.join(tempFolder, `${libraryName}-${tag}`);

		return { filePath, folderPath, tempFolder };
	}

	static getLibraryJsonPath(folderPath) {
		return this.buildPath(folderPath, 'library.json');
	}

	static checkPackageJsonPath(folderPath) {
		const packageJsonPath = this.buildPath(folderPath, 'package.json');
		return this.pathExists(packageJsonPath);
	}

	static getLibraryRepoMap() {
		return this.readYamlFile('config/h5p-library-repo-map.yaml');
	}

	static buildPath(...segments) {
		return path.join(...segments);
	}

	static removeNodeModulesPathIfExists(folderPath, logger) {
		const nodeModulesPath = this.buildPath(folderPath, 'node_modules');
		if (this.pathExists(nodeModulesPath)) {
			this.removeFolder(nodeModulesPath);
		}
	}
}

module.exports = FileSystemHelper;
