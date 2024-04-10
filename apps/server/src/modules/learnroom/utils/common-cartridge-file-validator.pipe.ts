import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommonCartridgeImportUtils } from '@src/modules/common-cartridge';
import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';
import { LearnroomConfig } from '../learnroom.config';

@Injectable()
export class CommonCartridgeFileValidatorPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
	constructor(private readonly configService: ConfigService<LearnroomConfig, true>) {}

	public transform(value: Express.Multer.File): Express.Multer.File {
		this.checkValue(value);
		this.checkSize(value);
		this.checkFileType(value);
		this.checkManifestFile(new AdmZip(value.buffer));

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
			const validateZipFile = () => new AdmZip(value.buffer);

			// checks if the file is a valid zip file
			validateZipFile();
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	private checkManifestFile(archive: AdmZip): void {
		const manifest = CommonCartridgeImportUtils.getManifestFileAsString(archive);
		if (!manifest) {
			throw new BadRequestException('No manifest file found in the archive');
		}

		try {
			const validateManifestXml = () => new JSDOM(archive.readAsText(manifest), { contentType: 'text/xml' });

			// checks if the manifest file is a valid XML file
			validateManifestXml();
		} catch (error) {
			throw new BadRequestException('Manifest file is not a valid XML file');
		}
	}
}
