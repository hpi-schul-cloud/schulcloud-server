import AdmZip from 'adm-zip';
import { tmpdir } from 'os';
import path from 'path';

export class ZipHelper {
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
}
