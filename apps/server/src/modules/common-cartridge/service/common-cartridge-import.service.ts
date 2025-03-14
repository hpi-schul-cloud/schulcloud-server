import { CoursesClientAdapter } from '@infra/courses-client';
import { BoardsClientAdapter } from '@infra/boards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CardClientAdapter } from '@infra/card-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeOrganizationProps, DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly coursesClient: CoursesClientAdapter,
		private boardsClient: BoardsClientAdapter,
		private columnClient: ColumnClientAdapter,
		private cardClient: CardClientAdapter
	) {}

	public async importFile(file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await this.createCourse(parser);
	}

	private async createCourse(parser: CommonCartridgeFileParser): Promise<void> {
		const courseName = parser.getTitle() ?? 'Untitled Course';

		const course = await this.coursesClient.createCourse({ title: courseName });

		await this.createBoards(course.courseId, parser);
	}

	private async createBoards(parentId: string, parser: CommonCartridgeFileParser): Promise<void> {
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === 0);

		// INFO: for await keeps the order of the boards in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the boards would be random
		for await (const board of boards) {
			const response = await this.boardsClient.createBoard({
				title: board.title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});

			await this.createColumns(response.id, board, parser);
		}
	}

	private async createColumns(
		boardId: string,
		board: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): Promise<void> {
		const columns = parser
			.getOrganizations()
			.filter((organization) => organization.path.startsWith(board.identifier) && organization.pathDepth === 1);

		// INFO: for await keeps the order of the columns in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the columns would be random
		for await (const column of columns) {
			const response = await this.boardsClient.createBoardColumn(boardId);

			await this.columnClient.updateBoardColumnTitle(response.id, { title: column.title });
		}
	}
}
