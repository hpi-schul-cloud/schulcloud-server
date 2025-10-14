import AdmZip from 'adm-zip';
import fs from 'fs';
import os from 'os';
import path from 'path';
import yaml from 'yaml';

export class FileSystemHelper {
	public static getAllFolders(dirPath: string): string[] {
		if (!this.pathExists(dirPath)) {
			throw new Error(`Path does not exist: ${dirPath}`);
		}
		const result = fs
			.readdirSync(dirPath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		return result;
	}

	public static getAllFilesAndFolders(dirPath: string): fs.Dirent[] {
		if (!this.pathExists(dirPath)) {
			throw new Error(`Path does not exist: ${dirPath}`);
		}
		const allFilesAndFolders = fs.readdirSync(dirPath, { withFileTypes: true });

		return allFilesAndFolders;
	}

	public static pathExists(path: string): boolean {
		const pathExists = fs.existsSync(path);

		return pathExists;
	}

	public static readJsonFile(filePath: string): unknown {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
		const json = JSON.parse(content) as unknown;

		return json;
	}

	public static readFile(filePath: string): string {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });

		return content;
	}

	public static readLibraryRepoMap = (mapFile: string): Record<string, string> => {
		const libraryRepoMap = this.readYamlFile(mapFile);

		if (!this.isLibraryRepoMapType(libraryRepoMap)) {
			throw new Error('Invalid input type for library repo map');
		}

		return libraryRepoMap;
	};

	public static isLibraryRepoMapType = (object: any): boolean => {
		const isType =
			typeof object === 'object' &&
			object !== null &&
			!Array.isArray(object) &&
			Object.values(object).every((v) => typeof v === 'string');

		return isType;
	};

	public static readLibraryWishList(filePath: string): string[] {
		const librariesYamlContent = this.readYamlFile(filePath);

		if (!this.isLibrariesContentType(librariesYamlContent)) {
			throw new Error('Invalid input type for library wish list');
		}

		const libraryWishList = librariesYamlContent.h5p_libraries;

		return libraryWishList;
	}

	public static isLibrariesContentType = (object: any): boolean => {
		const isType =
			typeof object === 'object' &&
			!Array.isArray(object) &&
			object !== null &&
			'h5p_libraries' in object &&
			Array.isArray(object.h5p_libraries);

		return isType;
	};

	public static readYamlFile(filePath: string): any {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
		const yamlContent = yaml.parse(content);

		return yamlContent;
	}

	public static writeJsonFile(filePath: string, json: any): void {
		fs.writeFileSync(filePath, JSON.stringify(json, null, 2), { encoding: 'utf-8' });
	}

	public static writeLibraryRepoMap(filePath: string, machineNameToRepoMap: Record<string, string>): void {
		const sorted = Object.keys(machineNameToRepoMap)
			.sort()
			.reduce((acc, key) => {
				acc[key] = machineNameToRepoMap[key];

				return acc;
			}, {});
		const yamlContent = yaml.stringify(sorted);
		fs.writeFileSync(filePath, yamlContent, { encoding: 'utf-8' });
	}

	public static removeTemporaryFiles(filePath: string, folderPath: string): void {
		this.removeFile(filePath);
		this.removeFolder(folderPath);
	}

	public static removeFile(filePath: string): void {
		fs.rmSync(filePath, { force: true });
	}

	public static removeFolder(folderPath: string): void {
		fs.rmSync(folderPath, { recursive: true, force: true });
	}

	public static unzipFile(zipFilePath: string, outputDir: string): void {
		const zip = new AdmZip(zipFilePath);
		zip.extractAllTo(outputDir, true);
	}

	public static getTempDir(): string {
		const tempDir = os.tmpdir();

		return tempDir;
	}

	public static createTempFolder(
		tempFolder: string,
		library: string,
		tag: string
	): { filePath: string; folderPath: string; tempFolder: string } {
		const filePath = path.join(tempFolder, `${library}-${tag}.zip`);

		const [tagMajor, tagMinor] = tag.split('.');
		const folderPath = path.join(tempFolder, `${library}-${tagMajor}.${tagMinor}`);

		return { filePath, folderPath, tempFolder };
	}

	public static createFolder(folderPath: string): void {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	public static getLibraryJsonPath(folderPath: string): string {
		const libraryJsonPath = this.buildPath(folderPath, 'library.json');

		return libraryJsonPath;
	}

	public static getSemanticsJsonPath(folderPath: string): string {
		const semanticsJsonPath = this.buildPath(folderPath, 'semantics.json');

		return semanticsJsonPath;
	}

	public static checkPackageJsonPath(folderPath: string): boolean {
		const packageJsonPath = this.buildPath(folderPath, 'package.json');
		const packageJsonPathExists = this.pathExists(packageJsonPath);

		return packageJsonPathExists;
	}

	public static buildPath(...segments: string[]): string {
		const result = path.join(...segments);

		return result;
	}

	public static unzipAndRenameFolder(
		filePath: string,
		folderPath: string,
		tempFolder: string,
		repo: string,
		tag: string
	): void {
		this.unzipFile(filePath, tempFolder);
		this.renameFolder(folderPath, tempFolder, repo, tag);
	}

	public static renameFolder(folderPath: string, tempFolder: string, repo: string, tag: string): void {
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

	public static getStatsOfPath(filePath: string): fs.Stats {
		const statsOfPath = fs.statSync(filePath);

		return statsOfPath;
	}
}
