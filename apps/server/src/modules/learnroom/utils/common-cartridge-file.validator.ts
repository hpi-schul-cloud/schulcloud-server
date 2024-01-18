import { FileValidator } from '@nestjs/common';
import AdmZip from 'adm-zip';

export class CommonCartridgeFileValidator extends FileValidator {
	public constructor() {
		super({});
	}

	public isValid(file?: unknown): boolean {
		if (
			file instanceof Object &&
			'buffer' in file &&
			file.buffer instanceof Buffer &&
			this.hasManifestFile(file.buffer)
		) {
			return true;
		}

		return false;
	}

	public buildErrorMessage(): string {
		return 'The file is not a valid Common Cartridge file.';
	}

	private hasManifestFile(file: Buffer): boolean {
		try {
			const archive = new AdmZip(file);
			const manifest = archive.getEntry('imsmanifest.xml') || archive.getEntry('manifest.xml');

			return manifest !== null;
		} catch (error) {
			return false;
		}
	}
}
