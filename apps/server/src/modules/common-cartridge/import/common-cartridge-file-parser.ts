import AdmZip from 'adm-zip';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';

export class CommonCartridgeFileParser {
	public readonly manifest: CommonCartridgeManifestParser;

	public constructor(file: Buffer) {
		const archive = new AdmZip(file);

		this.manifest = new CommonCartridgeManifestParser(this.getManifestFileAsString(archive));
	}

	private getManifestFileAsString(archive: AdmZip): string | never {
		const manifest = archive.getEntry('imsmanifest.xml') ?? archive.getEntry('manifest.xml');

		if (manifest) {
			return archive.readAsText(manifest);
		}

		throw new Error('Manifest file not found');
	}
}
