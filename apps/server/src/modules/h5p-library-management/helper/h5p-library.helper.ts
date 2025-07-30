import { ILibraryAdministrationOverviewItem, IUser } from '@lumieducation/h5p-server';
import AdmZip from 'adm-zip';
import { rmSync } from 'fs';

export class H5PLibraryHelper {
	public static createDefaultIUser(): IUser {
		const user: IUser = {
			email: 'a@b.de',
			id: 'a',
			name: 'a',
			type: 'local',
		};

		return user;
	}

	public static getAvailableVersions(availableLibraries: ILibraryAdministrationOverviewItem[]): string[] {
		const availableVersions = availableLibraries.map(
			(lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`
		);

		return availableVersions;
	}

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
		const highestPatchTags = Array.from(versionMap.values()).map((v) => v.tag);

		return highestPatchTags;
	}

	public static getHighestVersionTags(tags: string[], majorVersion: number, minorVersion: number): string | undefined {
		const matchingTags = tags.filter((t) => {
			const [maj, min] = t.split('.').map(Number);
			return maj === majorVersion && min === minorVersion;
		});
		let highestVersionTag: string | undefined;
		if (matchingTags.length > 0) {
			highestVersionTag = matchingTags.reduce((a, b) => {
				const patchA = Number(a.split('.')[2]);
				const patchB = Number(b.split('.')[2]);
				return patchA > patchB ? a : b;
			});
		}

		return highestVersionTag;
	}

	public static isCurrentVersionAvailable(library: string, tag: string, availableVersions: string[]): boolean {
		const currentPatchVersionAvailable = availableVersions.includes(`${library}-${tag}`);
		return currentPatchVersionAvailable;
	}

	public static isNewerPatchVersionAvailable(library: string, tag: string, availableVersions: string[]): boolean {
		const [tagMajor, tagMinor, tagPatch] = tag.split('.').map(Number);
		const newerPatchVersionAvailable = availableVersions.some((v) => {
			const [lib, version] = v.split('-');
			if (lib !== library) return false;
			const [major, minor, patch] = version.split('.').map(Number);
			const result = major === tagMajor && minor === tagMinor && patch >= tagPatch;
			return result;
		});

		return newerPatchVersionAvailable;
	}

	public static removeTemporaryFiles(filePath: string, folderPath: string): void {
		rmSync(filePath, { force: true });
		rmSync(folderPath, { recursive: true, force: true });
	}

	public static unzipFile(zipFilePath: string, outputDir: string): void {
		const zip = new AdmZip(zipFilePath);
		zip.extractAllTo(outputDir, true);
	}
}
