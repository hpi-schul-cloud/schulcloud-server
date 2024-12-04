import { Injectable } from '@nestjs/common';
import { CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';

@Injectable()
export class CommonCartridgeImportService {
	constructor(private readonly courseClient: CoursesClientAdapter) {}

	public async importCourse(file: Express.Multer.File): Promise<void> {
		const parser = new CommonCartridgeFileParser(file.buffer);

		await this.createCourse(parser);
	}

	private async createCourse(parser: CommonCartridgeFileParser): Promise<void> {
		// TODO: better default name
		const courseName = parser.getTitle() || 'Untitled Course';

		throw new Error('Not implemented');
	}
}
