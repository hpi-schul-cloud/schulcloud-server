import AdmZip from 'adm-zip';
import { DEFAULT_FILE_PARSER_OPTIONS } from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';

export class CommonCartridgeFileParser {
	private readonly manifestParser: CommonCartridgeManifestParser;

	public constructor(file: Buffer, private readonly options = DEFAULT_FILE_PARSER_OPTIONS) {
		const archive = new AdmZip(file);

		this.manifestParser = new CommonCartridgeManifestParser(this.getManifestFileAsString(archive), this.options);
	}

	public get manifest(): CommonCartridgeManifestParser {
		return this.manifestParser;
	}

	private getManifestFileAsString(archive: AdmZip): string | never {
		// imsmanifest.xml is the standard name, but manifest.xml is also valid until v1.3
		const manifest = archive.getEntry('imsmanifest.xml') || archive.getEntry('manifest.xml');

		if (manifest) {
			return archive.readAsText(manifest);
		}

		throw new CommonCartridgeManifestNotFoundException();
	}
}
