import AdmZip from 'adm-zip';
import { rmSync } from 'fs';

export class H5PLibraryHelper {
	public static getHighestPatchTags(tags: string[]): string[] {
		const semverRegex = /^v?(\d+)\.(\d+)\.(\d+)$/;
		const versionMap = new Map<string, { tag: string; patch: number }>();

		for (const tag of tags) {
			const match = tag.match(semverRegex);
			if (!match) continue;
			const [, major, minor, patch] = match;
			const key = `${major}.${minor}`;
			const patchNum = parseInt(patch, 10);

			const existing = versionMap.get(key);
			if (!existing || patchNum > existing.patch) {
				versionMap.set(key, { tag, patch: patchNum });
			}
		}

		return Array.from(versionMap.values()).map((v) => v.tag);
	}

	public static unzipFile(zipFilePath: string, outputDir: string): void {
		const zip = new AdmZip(zipFilePath);
		zip.extractAllTo(outputDir, true);
	}

	public static removeTemporaryFiles(filePath: string, folderPath: string): void {
		rmSync(filePath, { force: true });
		rmSync(folderPath, { recursive: true, force: true });
	}
}
