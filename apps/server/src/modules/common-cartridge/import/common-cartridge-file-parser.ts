import AdmZip from 'adm-zip';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';

export class CommonCartridgeFileParser {
	private readonly manifestParser: CommonCartridgeManifestParser;

	public constructor(file: Buffer) {
		const archive = new AdmZip(file);

		this.manifestParser = new CommonCartridgeManifestParser(this.getManifestFileAsString(archive));
	}

	public get manifest(): CommonCartridgeManifestParser {
		return this.manifestParser;
	}

	private getManifestFileAsString(archive: AdmZip): string | never {
		// The manifest file can be named either 'imsmanifest.xml' or 'manifest.xml'
		const manifest = archive.getEntry('imsmanifest.xml') ?? archive.getEntry('manifest.xml');

		if (manifest) {
			return archive.readAsText(manifest);
		}

		throw new CommonCartridgeManifestNotFoundException();
	}
}
