import { ICurrentUser } from '@infra/auth-guard';
import { BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import { CardClientAdapter, CardControllerCreateElement201Response } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import {
	CommonCartridgeFileFolderResourceProps,
	CommonCartridgeFileResourceProps,
	CommonCartridgeOrganizationProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from '../import/common-cartridge-import.types';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

const DEPTH_BOARD = 0;
const DEPTH_COLUMN = 1;
const DEPTH_CARD = 2;
const DEPTH_CARD_ELEMENTS = 3;

const DEFAULT_NEW_COURSE_COLOR = '#455B6A';

// Retry-Wrapper
async function retry<T>(fn: () => Promise<T>, retries = 5, delayMs = 500): Promise<T> {
	let lastError: unknown;
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err;
			// Optional: Log für Debugging
			// console.warn(`Retry attempt ${attempt + 1} failed:`, err);
			await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
		}
	}
	throw lastError;
}

interface ColumnResource {
	column: CommonCartridgeOrganizationProps;
	isResourceColumn: boolean;
}

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly coursesClient: CoursesClientAdapter,
		private readonly boardsClient: BoardsClientAdapter,
		private readonly columnClient: ColumnClientAdapter,
		private readonly cardClient: CardClientAdapter,
		private readonly fileClient: FilesStorageClientAdapter,
		private readonly commonCartridgeImportMapper: CommonCartridgeImportMapper
	) {}

	public async importFile(file: Buffer, currentUser: ICurrentUser): Promise<void> {
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

		// INFO: for await keeps the order of the boards in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the boards would be random
		const createdBoardIds = new Map<string, string>();
		for await (const board of boards) {
			const response = await this.boardsClient.createBoard({
				title: board.title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});

			createdBoardIds.set(board.identifier, response.id);
		}

		for await (const board of boards) {
			const responseId = createdBoardIds.get(board.identifier);

			if (!responseId) continue;

			await this.createColumns(responseId, board, parser, currentUser);
		}
	}

	private async createColumns(
		boardId: string,
		board: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser,
		currentUser: ICurrentUser
	): Promise<void> {
		const columns: ColumnResource[] = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_COLUMN && organization.path.startsWith(board.identifier)
			)
			.map((column) => {
				return {
					column,
					isResourceColumn: column.isResource,
				};
			});

		// INFO: for await keeps the order of the columns in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the columns would be random
		for await (const columnResource of columns) {
			columnResource.isResourceColumn
				? await this.createColumnWithResource(parser, boardId, columnResource.column, currentUser)
				: await this.createColumn(parser, boardId, columnResource.column, currentUser);
		}
	}

	private async createColumnWithResource(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const columnResponse = await retry(() => this.boardsClient.createBoardColumn(boardId));
		await this.columnClient.updateBoardColumnTitle(columnResponse.id, { title: columnProps.title });

		await this.createCardElementWithResource(parser, columnResponse, columnProps, currentUser);
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const columnResponse = await retry(() => this.boardsClient.createBoardColumn(boardId));
		await this.columnClient.updateBoardColumnTitle(columnResponse.id, { title: columnProps.title });

		const cards = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(columnProps.path)
			);

		for (const card of cards) {
			card.isResource
				? await this.createCardElementWithResource(parser, columnResponse, card, currentUser)
				: await this.createCard(parser, columnResponse, card, currentUser);
		}
	}

	private async createCardElementWithResource(
		parser: CommonCartridgeFileParser,
		columnResponse: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const card = await retry(() => this.columnClient.createCard(columnResponse.id, {}));

		await this.createCardElement(parser, card.id, cardProps, currentUser);
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const card = await retry(() => this.columnClient.createCard(column.id, {}));
		await this.cardClient.updateCardTitle(card.id, {
			title: cardProps.title,
		});

		const organizations = parser.getOrganizations();
		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
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
			parser.options.inputFormat
		);

		if (!resourceBody) return;

		const contentElement = await retry(() =>
			this.cardClient.createCardElement(cardId, {
				type: contentElementType,
			})
		);

		if (resource.type === 'file' || resource.type === 'fileFolder') {
			await this.uploadFiles(currentUser, resource, contentElement);
		}

		await this.cardClient.updateCardElement(contentElement.id, {
			data: resourceBody,
		});
	}

	private async uploadFiles(
		currentUser: ICurrentUser,
		resource: CommonCartridgeFileResourceProps | CommonCartridgeFileFolderResourceProps,
		cardElement: CardControllerCreateElement201Response
	): Promise<void> {
		const { schoolId } = currentUser;

		const files: File[] = [];
		switch (resource.type) {
			case 'file':
				files.push(resource.file);
				break;
			case 'fileFolder':
				files.push(...resource.files);
				break;
		}

		const uploadPromises = files.map((file) =>
			this.fileClient.upload(schoolId, 'school', cardElement.id, 'boardnodes', file)
		);
		await Promise.all(uploadPromises);
	}
}
