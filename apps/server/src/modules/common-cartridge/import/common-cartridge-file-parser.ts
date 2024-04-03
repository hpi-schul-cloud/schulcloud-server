import AdmZip from 'adm-zip';
import { CommonCartridgeResourceNotFoundException } from './utils/common-cartridge-resource-not-found.exception';
import { DEFAULT_FILE_PARSER_OPTIONS } from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';

export class CommonCartridgeFileParser {
	private readonly manifestParser: CommonCartridgeManifestParser;

	private readonly archive: AdmZip;

	public constructor(file: Buffer, private readonly options = DEFAULT_FILE_PARSER_OPTIONS) {
		this.archive = new AdmZip(file);

		this.manifestParser = new CommonCartridgeManifestParser(this.getManifestFileAsString(), this.options);
	}

	public get manifest(): CommonCartridgeManifestParser {
		return this.manifestParser;
	}

	private getManifestFileAsString(): string | never {
		// imsmanifest.xml is the standard name, but manifest.xml is also valid until v1.3
		const manifest: AdmZip.IZipEntry | null =
			this.archive.getEntry('imsmanifest.xml') || this.archive.getEntry('manifest.xml');

		if (manifest) {
			return this.archive.readAsText(manifest);
		}

		throw new CommonCartridgeManifestNotFoundException();
	}

	public getResourceAsString(filepath: string): string {

		const resource: AdmZip.IZipEntry | null = this.archive.getEntry(filepath);

		if (resource) {
			return this.archive.readAsText(filepath);
		}

		throw new CommonCartridgeResourceNotFoundException();
	}
}
