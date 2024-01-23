import { FileValidator, Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';

@Injectable()
export class CommonCartridgeFileValidator extends FileValidator {
	public constructor() {
		super({});
	}

	public isValid(file?: Express.Multer.File): boolean {
		if (!file) {
			return false;
		}

		if (!this.hasManifestFile(file.buffer)) {
			return false;
		}

		return true;
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
