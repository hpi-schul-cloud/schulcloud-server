import { IInstalledLibrary } from '@lumieducation/h5p-server/build/src/types';
import { FileSystemHelper } from '../helper/file-system.helper';

export class H5pConsistencyChecker {
	public checkConsistency(folderPath: string): boolean {
		try {
			const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
			if (!FileSystemHelper.pathExists(libraryJsonPath)) {
				this.logLibraryJsonNotFound(folderPath);
				return false;
			}

			const libraryJson = FileSystemHelper.readJsonFile(libraryJsonPath) as IInstalledLibrary;

			const jsIsMissing = this.checkJsFilesMissing(folderPath, libraryJson);
			if (jsIsMissing) {
				return false;
			}

			const cssIsMissing = this.checkCssFilesMissing(folderPath, libraryJson);
			if (cssIsMissing) {
				return false;
			}

			this.logConsistencyCheckPassed(folderPath);
			return true;
		} catch (error) {
			console.error(`Error during consistency check for ${folderPath}:`, error);
			return false;
		}
	}

	private checkJsFilesMissing(folderPath: string, libraryJson: IInstalledLibrary): boolean {
		const jsPaths = this.getJsPaths(libraryJson);
		const missingFiles = this.getMissingFiles(folderPath, jsPaths);

		if (missingFiles.length > 0) {
			this.logMissingFiles(folderPath, 'JS', missingFiles);
			return true;
		}

		return false;
	}

	private checkCssFilesMissing(folderPath: string, libraryJson: IInstalledLibrary): boolean {
		const cssPaths = this.getCssPaths(libraryJson);
		const missingFiles = this.getMissingFiles(folderPath, cssPaths);

		if (missingFiles.length > 0) {
			this.logMissingFiles(folderPath, 'CSS', missingFiles);
			return true;
		}

		return false;
	}

	private getJsPaths(libraryJson: IInstalledLibrary): string[] {
		return libraryJson.preloadedJs?.map((js) => js.path) || [];
	}

	private getCssPaths(libraryJson: IInstalledLibrary): string[] {
		return libraryJson.preloadedCss?.map((css) => css.path) || [];
	}

	private getMissingFiles(folderPath: string, filePaths: string[]): string[] {
		const missingFiles = filePaths.filter((filePath) => {
			const fullPath = FileSystemHelper.buildPath(folderPath, filePath);
			return !FileSystemHelper.pathExists(fullPath);
		});

		return missingFiles;
	}

	private logLibraryJsonNotFound(folderPath: string): void {
		console.error(`library.json not found in ${folderPath}`);
	}

	private logMissingFiles(folderPath: string, fileType: string, missingFiles: string[]): void {
		console.error(`Missing ${fileType} files in ${folderPath}: ${missingFiles.join(', ')}`);
	}

	private logConsistencyCheckPassed(folderPath: string): void {
		console.log(`Consistency check passed for ${folderPath}`);
	}
}
