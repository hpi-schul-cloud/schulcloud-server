import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import yaml from 'yaml';

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
}
