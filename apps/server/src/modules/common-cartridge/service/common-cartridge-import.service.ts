import { BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import { CardClientAdapter } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeOrganizationProps, DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

const DEPTH_BOARD = 0;
const DEPTH_COLUMN = 1;
const DEPTH_CARD = 2;
const DEPTH_CARD_ELEMENTS = 3;

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly coursesClient: CoursesClientAdapter,
		private boardsClient: BoardsClientAdapter,
		private columnClient: ColumnClientAdapter,
		private cardClient: CardClientAdapter,
		private commonCartridgeImportMapper: CommonCartridgeImportMapper
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
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === DEPTH_BOARD);

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
		const columnsWithResource = parser
			.getOrganizations()
			.filter(
				(organization) =>
					organization.pathDepth === DEPTH_COLUMN &&
					organization.path.startsWith(board.identifier) &&
					organization.isResource
			);

		const columnsWithoutResource = parser
			.getOrganizations()
			.filter(
				(organization) =>
					organization.pathDepth === DEPTH_COLUMN &&
					organization.path.startsWith(board.identifier) &&
					!organization.isResource
			);

		// INFO: for await keeps the order of the columns in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the columns would be random
		for await (const column of columnsWithResource) {
			await this.createColumnWithResource(parser, boardId, column);
		}

		for await (const column of columnsWithoutResource) {
			await this.createColumn(parser, boardId, column);
		}
	}

	private async createColumnWithResource(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(boardId);
		await this.columnClient.updateBoardColumnTitle(columnResponse.id, { title: columnProps.title });

		await this.createCardElementWithResource(parser, columnResponse, columnProps);
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(boardId);
		await this.columnClient.updateBoardColumnTitle(columnResponse.id, { title: columnProps.title });

		await this.createCards(parser, columnResponse, columnProps);
	}

	private async createCardElementWithResource(
		parser: CommonCartridgeFileParser,
		columnResponse: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps
	): Promise<void> {
		const card = await this.columnClient.createCard(columnResponse.id, {});

		await this.createCardElement(parser, card.id, cardProps);
	}

	private async createCards(
		parser: CommonCartridgeFileParser,
		columnResponse: ColumnResponse,
		column: CommonCartridgeOrganizationProps
	): Promise<void> {
		const cards = parser
			.getOrganizations()
			.filter((organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(column.path));

		for await (const card of cards) {
			await this.createCard(parser, columnResponse, card);
		}
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps
	): Promise<void> {
		const card = await this.columnClient.createCard(column.id, {});
		await this.cardClient.updateCardTitle(card.id, {
			title: cardProps.title,
		});

		const organizations = parser.getOrganizations();
		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
		);

		for await (const cardElement of cardElements) {
			await this.createCardElement(parser, card.id, cardElement);
		}
	}

	private async createCardElement(
		parser: CommonCartridgeFileParser,
		cardId: string,
		cardElementProps: CommonCartridgeOrganizationProps
	): Promise<void> {
		if (!cardElementProps.isResource) return;

		const resource = parser.getResource(cardElementProps);
		if (!resource) return;

		const contentElementType = this.commonCartridgeImportMapper.mapResourceTypeToContentElementType(resource.type);

		if (!contentElementType) return;

		const resourceBody = this.commonCartridgeImportMapper.mapResourceToContentBody(
			resource,
			cardElementProps,
			parser.options.inputFormat
		);

		if (!resourceBody) return;

		const contentElement = await this.cardClient.createCardElement(cardId, {
			type: contentElementType,
		});

		await this.cardClient.updateCardElement(contentElement.id, {
			data: resourceBody,
		});
	}
}
