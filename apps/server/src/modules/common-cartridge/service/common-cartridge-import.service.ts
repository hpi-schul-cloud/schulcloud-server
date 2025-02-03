/* eslint-disable @typescript-eslint/no-unused-vars */
import { CoursesClientAdapter } from '@infra/courses-client';
import { Injectable } from '@nestjs/common';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeOrganizationProps, DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';

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

	private async createBoards(parentId: string, parser: CommonCartridgeFileParser): Promise<void> {
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === 0);
		const promises = boards.map(async (board) => {
			const response = await this.boardsClient.createBoard({
				title: board.title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});

			await this.createColumns(response.id, board, parser);
		});

		await Promise.all(promises);
	}

	private async createColumns(
		boardId: string,
		board: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): Promise<void> {
		const promises = parser
			.getOrganizations()
			.filter((org) => org.path.startsWith(board.path) && org.pathDepth === board.pathDepth + 1)
			.filter((org) => org.isResource === false)
			.map(async (org) => {
				const response = await this.boardsClient.createBoardColumn(boardId);

				await this.boardsClient.updateBoardColumnTitle(response.id, { title: org.title });
			});

		await Promise.all(promises);
	}
}
