import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LearnroomConfig } from '../learnroom.config';

@Injectable()
export class CommonCartridgeFileValidatorPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
	private zipFileMagicNumber = '504b0304';

	constructor(private readonly configService: ConfigService<LearnroomConfig, true>) {}

	public transform(value: Express.Multer.File): Express.Multer.File {
		this.checkValue(value);
		this.checkSize(value);
		this.checkFileType(value);

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
		const buffer = value.buffer.toString('hex', 0, 4);

		if (buffer !== this.zipFileMagicNumber) {
			throw new BadRequestException('File is not a zip archive');
		}
	}
}
