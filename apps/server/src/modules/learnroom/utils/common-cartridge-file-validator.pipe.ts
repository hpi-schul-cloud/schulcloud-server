import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { LearnroomConfigService } from '../service';

@Injectable()
export class CommonCartridgeFileValidatorPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
	constructor(private readonly configService: LearnroomConfigService) {}

	public transform(value: Express.Multer.File): Express.Multer.File {
		if (!value) {
			throw new BadRequestException('No file uploaded');
		}

		if (!value?.mimetype.match(/application\/(octet-stream|.*zip.*)/)) {
			throw new BadRequestException('Invalid file type');
		}

		if (value?.size > this.configService.commonCartridgeImportMaxFileSize) {
			throw new BadRequestException('File too big');
		}

		if (!this.hasManifestFile(value?.buffer)) {
			throw new BadRequestException('No manifest file found');
		}

		return value;
	}

	private hasManifestFile(file: Buffer): boolean {
		try {
			const archive = new AdmZip(file);
			// imsmanifest.xml is the standard name, but manifest.xml is also valid until v1.3
			const manifest = archive.getEntry('imsmanifest.xml') || archive.getEntry('manifest.xml');

			return manifest !== null;
		} catch (error) {
			return false;
		}
	}
}
