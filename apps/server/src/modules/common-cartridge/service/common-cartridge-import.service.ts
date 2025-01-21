import { CoursesClientAdapter } from '@infra/courses-client';
import { Injectable } from '@nestjs/common';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';

@Injectable()
export class CommonCartridgeImportService {
	constructor(private readonly coursesClient: CoursesClientAdapter, private boardsClient: BoardsClientAdapter) {}

	public async importFile(file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await this.createCourse(parser);
	}

	private async createCourse(parser: CommonCartridgeFileParser): Promise<void> {
		const courseName = parser.getTitle() ?? 'Untitled Course';

		const course = await this.coursesClient.createCourse({ title: courseName });

		await this.createBoards(course.courseId, parser);
	}

	private async createBoards(parentId: string, parser: CommonCartridgeFileParser): Promise<string[]> {
		const titles = parser
			.getOrganizations()
			.filter((organization) => organization.pathDepth === 0)
			.map((organization) => organization.title);
		const ids = new Array<string>();

		for await (const title of titles) {
			const response = await this.boardsClient.createBoard({
				title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});

			ids.push(response.id);
		}

		return ids;
	}
}
