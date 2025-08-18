import { BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import {
	CardClientAdapter,
	LinkContentBody,
	LinkElementContentBody,
	RichTextContentBody,
	RichTextElementContentBody,
	UpdateElementContentBodyParams,
	FileElementContentBody,
} from '@infra/cards-client';
import { ColumnClientAdapter, CreateCardImportBodyParams, FileContentBody } from '@infra/column-client';
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
		for await (const board of boards) {
			const response = await this.boardsClient.createBoard({
				title: board.title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});

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

		// INFO: for await keeps the order of the columns in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the columns would be random
		for await (const column of columnsWithResource) {
			await this.createColumnWithResource(parser, boardId, column, currentUser);
		}

		for await (const column of columnsWithoutResource) {
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

		const cards = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(columnProps.path)
			);
		const cardsWithResource = cards.filter((card) => card.isResource);

		for await (const card of cardsWithResource) {
			await this.createCardElementWithResource(parser, columnResponse, card, currentUser);
		}

		const cardsWithoutResource = cards.filter((card) => !card.isResource);

		for await (const card of cardsWithoutResource) {
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

		await this.createCardElement(parser, card.id, cardProps, currentUser);
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		currentUser: ICurrentUser
	): Promise<void> {
		const organizations = parser.getOrganizations();
		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
		);
		const commonCartridgeResourcesList: { id: string; resource: CommonCartridgeFileResourceProps }[] = [];
		const cardElementsMapped = (this.mapCardElements(cardElements, parser, commonCartridgeResourcesList)).filter(
			(element) => element !== undefined && element !== null
		);
		const cardCreateImportParams: CreateCardImportBodyParams = {
			cardTitle: cardProps.title,
			cardElements: cardElementsMapped,
		};
		const cardResponse = await this.columnClient.createCardWithContent(column.id, cardCreateImportParams);

		for await (const element of cardResponse.elements) {
			const foundItem = commonCartridgeResourcesList.find((item) => item.id === element.id);

			if (element.content === 'file' && foundItem?.resource) {
				await this.uploadFile(currentUser, foundItem.resource, cardResponse.id);
			}
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
			await this.uploadFile(currentUser, resource, contentElement.id);
		}

		await this.cardClient.updateCardElement(contentElement.id, {
			data: resourceBody,
		});
	}

	private mapCardElements(
		cardElements: CommonCartridgeOrganizationProps[],
		parser: CommonCartridgeFileParser,
		commonCartridgeResourcesList: { id: string; resource: CommonCartridgeFileResourceProps }[]
	): UpdateElementContentBodyParams[] {
		return cardElements
			.map((element) => {
				if (!element.isResource) return null;

				const resource = parser.getResource(element);
				if (!resource) return null;

				if (resource.type === 'file') {
					commonCartridgeResourcesList.push({ id: element.identifier ?? '', resource });
				}
				const contentElementType = this.commonCartridgeImportMapper.mapResourceTypeToContentElementType(resource.type);
				if (!contentElementType) return null;

				const resourceBody = this.commonCartridgeImportMapper.mapResourceToContentBody(
					resource,
					element,
					parser.options.inputFormat
				);

				if (!resourceBody) return null;

				const updateElementContentBodyParamsData = {
					type: contentElementType,
					content: this.convertElementToContentBody(resourceBody),
				};

				return {
					data: updateElementContentBodyParamsData,
				} as UpdateElementContentBodyParams;
			})
			.filter((element): element is UpdateElementContentBodyParams => element !== null && element !== undefined);
	}

	private convertElementToContentBody(
		element: LinkElementContentBody | RichTextElementContentBody | FileElementContentBody
	): LinkContentBody | RichTextContentBody | FileContentBody | undefined {
		if (element === undefined) return;
		if (element.type === 'link') {
			return element.content as LinkContentBody;
		} else if (element.type === 'file') {
			return element.content as FileContentBody;
		}
		// Default to RICH_TEXT
		return element.content as RichTextContentBody;
	}

	private async uploadFile(
		currentUser: ICurrentUser,
		resource: CommonCartridgeFileResourceProps,
		cardElementId: string
	): Promise<void> {
		const { schoolId } = currentUser;

		await this.fileClient.upload(schoolId, 'school', cardElementId, 'boardnodes', resource.file);
	}
}
