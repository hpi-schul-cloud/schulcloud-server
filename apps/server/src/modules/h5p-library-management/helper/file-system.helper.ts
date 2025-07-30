import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import yaml from 'yaml';
import AdmZip from 'adm-zip';
import { tmpdir } from 'os';
import path from 'path';

export class FileSystemHelper {
	public static pathExists(path: string): boolean {
		const result = existsSync(path);

		return result;
	}

	public static readLibraryJson(filePath: string): {
		majorVersion: number;
		minorVersion: number;
		patchVersion: number;
		[key: string]: unknown;
	} {
		const content = readFileSync(filePath, { encoding: 'utf-8' });
		const json = JSON.parse(content) as {
			majorVersion: number;
			minorVersion: number;
			patchVersion: number;
			[key: string]: unknown;
		};
		return json;
	}

	public static readFile(filePath: string): string {
		const content = readFileSync(filePath, { encoding: 'utf-8' });

		return content;
	}

	public static readYamlFile(filePath: string): Record<string, string> {
		const content = readFileSync(filePath, { encoding: 'utf-8' });
		const yamlContent = yaml.parse(content) as Record<string, string>;

		return yamlContent;
	}

	public static writeLibraryJson(
		filePath: string,
		json: {
			majorVersion: number;
			minorVersion: number;
			patchVersion: number;
			[key: string]: unknown;
		}
	): void {
		writeFileSync(filePath, JSON.stringify(json, null, 2), { encoding: 'utf-8' });
	}

	public static removeTemporaryFiles(filePath: string, folderPath: string): void {
		this.removeFile(filePath);
		this.removeFolder(folderPath);
	}

	public static removeFile(filePath: string): void {
		rmSync(filePath, { force: true });
	}

	public static removeFolder(folderPath: string): void {
		rmSync(folderPath, { recursive: true, force: true });
	}

	public static unzipFile(zipFilePath: string, outputDir: string): void {
		const zip = new AdmZip(zipFilePath);
		zip.extractAllTo(outputDir, true);
	}

	public static createTempFolder(
		library: string,
		tag: string
	): { filePath: string; folderPath: string; tempFolder: string } {
		const tempFolder = tmpdir();
		const libraryName = library.split('/')[1];
		const filePath = path.join(tempFolder, `${libraryName}-${tag}.zip`);
		const folderPath = path.join(tempFolder, `${libraryName}-${tag}`);

		return { filePath, folderPath, tempFolder };
	}

	public static getLibraryJsonPath(folderPath: string): string {
		return this.buildPath(folderPath, 'library.json');
	}

	public static getPackageJsonPath(folderPath: string): string {
		return this.buildPath(folderPath, 'package.json');
	}

	public static getNodeModulesPath(folderPath: string): string {
		return this.buildPath(folderPath, 'node_modules');
	}

	public static buildPath(...segments: string[]): string {
		return path.join(...segments);
	}
}
