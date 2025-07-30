import AdmZip from 'adm-zip';

export class ZipHelper {
	public static unzipFile(zipFilePath: string, outputDir: string): void {
		const zip = new AdmZip(zipFilePath);
		zip.extractAllTo(outputDir, true);
	}
}
