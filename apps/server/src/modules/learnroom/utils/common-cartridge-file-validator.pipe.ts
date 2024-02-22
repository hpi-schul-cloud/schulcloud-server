import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AdmZip from 'adm-zip';
import { LearnroomConfig } from '../learnroom.config';

@Injectable()
export class CommonCartridgeFileValidatorPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
	constructor(private readonly configService: ConfigService<LearnroomConfig, true>) {}

	public transform(value: Express.Multer.File): Express.Multer.File {
		this.checkValue(value);
		this.checkSize(value);
		this.checkFileType(value);
		this.checkForManifestFile(new AdmZip(value.buffer));

		return value;
	}

	private checkValue(value: Express.Multer.File): void {
		if (!value) {
			throw new BadRequestException('No file uploaded');
		}
	}

	private checkSize(value: Express.Multer.File): void {
		if (value.size > this.configService.getOrThrow<number>('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE')) {
			throw new BadRequestException('File is too large');
		}
	}

	private checkFileType(value: Express.Multer.File): void {
		try {
			// checks if the file is a valid zip file
			// eslint-disable-next-line no-new
			new AdmZip(value.buffer);
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	private checkForManifestFile(archive: AdmZip): void {
		const manifest = archive.getEntry('imsmanifest.xml') || archive.getEntry('manifest.xml');
		if (!manifest) {
			throw new BadRequestException('No manifest file found in the archive');
		}
	}
}
