import { IInstalledLibrary } from '@lumieducation/h5p-server/build/src/types';
import { FileSystemHelper } from '../helper/file-system.helper';
import { h5pLogger } from '../helper/h5p-logger.helper';

export class H5pConsistencyChecker {
	private readonly logger = h5pLogger;

	public checkConsistency(folderPath: string): boolean {
		try {
			const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
			if (!FileSystemHelper.pathExists(libraryJsonPath)) {
				this.logger.error(`library.json not found in ${folderPath}`);
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

			this.logger.debug('Consistency check passed');
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Consistency check error: ${message}`);
			return false;
		}
	}

	private checkJsFilesMissing(folderPath: string, libraryJson: IInstalledLibrary): boolean {
		const jsPaths = this.getJsPaths(libraryJson);
		const missingFiles = this.getMissingFiles(folderPath, jsPaths);

		if (missingFiles.length > 0) {
			this.logger.error(`Missing JS files: ${missingFiles.join(', ')}`);
			return true;
		}

		return false;
	}

	private checkCssFilesMissing(folderPath: string, libraryJson: IInstalledLibrary): boolean {
		const cssPaths = this.getCssPaths(libraryJson);
		const missingFiles = this.getMissingFiles(folderPath, cssPaths);

		if (missingFiles.length > 0) {
			this.logger.error(`Missing CSS files: ${missingFiles.join(', ')}`);
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
}
