import { BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import { CardClientAdapter, CardControllerCreateElement201Response } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import {
	CommonCartridgeFileResourceProps,
	CommonCartridgeOrganizationProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from '../import/common-cartridge-import.types';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';
import { ICurrentUser } from '@infra/auth-guard';
import { LegacyLogger } from '@core/logger';

const DEPTH_BOARD = 0;
const DEPTH_COLUMN = 1;
const DEPTH_CARD = 2;
const DEPTH_CARD_ELEMENTS = 3;

const DEFAULT_NEW_COURSE_COLOR = '#455B6A';

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly coursesClient: CoursesClientAdapter,
		private readonly boardsClient: BoardsClientAdapter,
		private readonly columnClient: ColumnClientAdapter,
		private readonly cardClient: CardClientAdapter,
		private readonly fileClient: FilesStorageClientAdapter,
		private readonly commonCartridgeImportMapper: CommonCartridgeImportMapper,
		private readonly logger: LegacyLogger
	) {}

	public async importFile(file: Buffer, currentUser: ICurrentUser): Promise<void> {
		this.logger.setContext('CommonCartridgeImportService');

		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await this.createCourse(parser, currentUser);
	}

	private async createCourse(parser: CommonCartridgeFileParser, currentUser: ICurrentUser): Promise<void> {
		const courseName = parser.getTitle() ?? 'Untitled Course';

		const course = await this.coursesClient.createCourse({ name: courseName, color: DEFAULT_NEW_COURSE_COLOR });

		await this.createBoards(course.courseId, parser, currentUser);
	}

	private async createBoards(
		parentId: string,
		parser: CommonCartridgeFileParser,
		currentUser: ICurrentUser
	): Promise<void> {
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === DEPTH_BOARD);

		this.logger.log(`Found ${boards.length} boards`);

		// INFO: for await keeps the order of the boards in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the boards would be random
		for (const board of boards) {
			const response = await this.boardsClient.createBoard({
				title: board.title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});

			this.logger.log(`Created board '${board.title}'`);

			await this.createColumns(response.id, board, parser, currentUser);
		}
	}

	private async createColumns(
		boardId: string,
		board: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser,
		currentUser: ICurrentUser
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

		this.logger.log(
			`Found ${columnsWithResource.length} columns with resources and ${columnsWithoutResource.length} without resources in board '${board.title}'`
		);

		// INFO: for await keeps the order of the columns in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the columns would be random
		for (const column of columnsWithResource) {
			await this.createColumnWithResource(parser, boardId, column, currentUser);
		}

		for (const column of columnsWithoutResource) {
			await this.createColumn(parser, boardId, column, currentUser);
		}
	}

	private async createColumnWithResource(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(boardId);
		await this.columnClient.updateBoardColumnTitle(columnResponse.id, { title: columnProps.title });

		this.logger.log(`Created column with resource of '${columnProps.title}'`);
		await this.createCardElementWithResource(parser, columnResponse, columnProps, currentUser);
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(boardId);
		await this.columnClient.updateBoardColumnTitle(columnResponse.id, { title: columnProps.title });

		this.logger.log(`Created column without resource of '${columnProps.title}'`);

		const cards = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(columnProps.path)
			);
		const cardsWithResource = cards.filter((card) => card.isResource);

		this.logger.log(`Found ${cardsWithResource.length} cards with resources in column '${columnProps.title}'`);

		for (const card of cardsWithResource) {
			await this.createCardElementWithResource(parser, columnResponse, card, currentUser);
		}

		const cardsWithoutResource = cards.filter((card) => !card.isResource);
		this.logger.log(`Found ${cardsWithoutResource.length} cards without resources in column '${columnProps.title}'`);

		for (const card of cardsWithoutResource) {
			await this.createCard(parser, columnResponse, card, currentUser);
		}
	}

	private async createCardElementWithResource(
		parser: CommonCartridgeFileParser,
		columnResponse: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const card = await this.columnClient.createCard(columnResponse.id, {});

		this.logger.log(`Created card with resource of '${cardProps.title}' in column '${columnResponse.title}'`);

		await this.createCardElement(parser, card.id, cardProps, currentUser);
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const card = await this.columnClient.createCard(column.id, {});
		await this.cardClient.updateCardTitle(card.id, {
			title: cardProps.title,
		});

		this.logger.log(`Created card without resource of '${cardProps.title}' in column '${column.title}'`);

		const organizations = parser.getOrganizations();
		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
		);

		this.logger.log(
			`Found ${cardElements.length} card elements for card '${cardProps.title}' in column '${column.title}'`
		);

		for await (const cardElement of cardElements) {
			await this.createCardElement(parser, card.id, cardElement, currentUser);
		}
	}

	private async createCardElement(
		parser: CommonCartridgeFileParser,
		cardId: string,
		cardElementProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
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

		if (resource.type === 'file') {
			await this.uploadFile(currentUser, resource, contentElement);

			this.logger.log(`Uploaded file for card element '${cardElementProps.title}'`);
		}

		await this.cardClient.updateCardElement(contentElement.id, {
			data: resourceBody,
		});

		this.logger.log(`Created card element '${cardElementProps.title}'`);
	}

	private async uploadFile(
		currentUser: ICurrentUser,
		resource: CommonCartridgeFileResourceProps,
		cardElement: CardControllerCreateElement201Response
	): Promise<void> {
		const { schoolId } = currentUser;

		await this.fileClient.upload(schoolId, 'school', cardElement.id, 'boardnodes', resource.file);
	}
}
