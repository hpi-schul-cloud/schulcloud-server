import { CoursesClientAdapter } from '@infra/courses-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';

@Injectable()
export class CommonCartridgeImportService {
	constructor(private readonly courseClient: CoursesClientAdapter) {}

	public async importFile(file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await this.createCourse(parser);
	}

	private createCourse(parser: CommonCartridgeFileParser): Promise<void> {
		// TODO: better default name
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const courseName = parser.getTitle() || 'Untitled Course';

		throw new Error('Not implemented');
	}
}
