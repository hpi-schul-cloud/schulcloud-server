import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class HelpdeskFileValidationPipe implements PipeTransform<Express.Multer.File[], Express.Multer.File[]> {
	private readonly maxFileSize = 5000 * 1024; // 5 MB

	public transform(files: Express.Multer.File[]): Express.Multer.File[] {
		if (!files || files.length === 0) {
			// No file uploaded, which is allowed
			return files;
		}

		const totalFilesSize = files.reduce((acc, file) => acc + file.size, 0);
		this.validateFilesSize(totalFilesSize);

		for (const file of files) {
			this.validateFileType(file);
		}

		return files;
	}

	private validateFileType(file: Express.Multer.File): void {
		const test = new RegExp(
			'image/*|video/*|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|application/pdf'
		);
		if (!file.mimetype || test.test(file.mimetype) === false) {
			throw new BadRequestException(`Invalid file type. Allowed types are images, videos, Word documents, and PDFs.`);
		}
	}

	private validateFilesSize(fileSize: number): void {
		if (fileSize > this.maxFileSize) {
			throw new BadRequestException(`File size should not exceed ${this.maxFileSize} bytes.`);
		}
	}
}
