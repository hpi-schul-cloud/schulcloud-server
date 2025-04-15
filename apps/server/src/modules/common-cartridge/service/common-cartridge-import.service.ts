import { BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import {
	CardClientAdapter,
	LinkElementContentBody,
	RichTextElementContentBody,
	UpdateElementContentBodyParamsData,
} from '@infra/card-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Injectable } from '@nestjs/common';
import { InputFormat } from '@shared/domain/types';
import {
	CommonCartridgeImportOrganizationProps,
	CommonCartridgeImportResourceProps,
	CommonCartridgeImportWebContentResourceProps,
	CommonCartridgeResourceTypeV1P1,
} from '..';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import {
	CommonCartridgeOrganizationProps,
	CommonCartridgeWebLinkResourceProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from '../import/common-cartridge-import.types';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

const DEPTH_CARD_ELEMENTS = 3;
const DEPTH_CARD = 2;
const DEPTH_COLUMN = 1;
const DEPTH_BOARD = 0;
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
		const columns = parser
			.getOrganizations()
			.filter(
				(organization) => organization.path.startsWith(board.identifier) && organization.pathDepth === DEPTH_COLUMN
			);

		// INFO: for await keeps the order of the columns in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the columns would be random
		for await (const column of columns) {
			const columnResponse = await this.boardsClient.createBoardColumn(boardId);

			const cards = parser
				.getOrganizations()
				.filter((organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(column.path));

			const cardsWithResource = cards.filter((card) => card.isResource);
			const cardsWithoutResource = cards.filter((card) => !card.isResource);

			await this.columnClient.updateBoardColumnTitle(columnResponse.id, { title: column.title });

			for await (const card of cardsWithResource) {
				await this.createCardWithElement(parser, columnResponse, card);
			}

			for await (const card of cardsWithoutResource) {
				await this.createCard(parser, columnResponse, card);
			}
		}
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeImportOrganizationProps
	): Promise<void> {
		const organizations = parser.getOrganizations();
		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
		);

		const card = await this.columnClient.createCard(column.id, {});

		for await (const cardElement of cardElements) {
			await this.createCardElement(parser, card.id, cardElement);
		}
	}

	private async createCardWithElement(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeImportOrganizationProps
	): Promise<void> {
		const card = await this.columnClient.createCard(column.id, {});

		await this.cardClient.updateCardTitle(card.id, {
			title: cardProps.title,
		});

		await this.createCardElement(parser, card.id, cardProps);
	}

	private async createCardElement(
		parser: CommonCartridgeFileParser,
		cardId: string,
		cardElementProps: CommonCartridgeImportOrganizationProps
	): Promise<void> {
		if (!cardElementProps.isResource) return;

		const resource = parser.getResource(cardElementProps);
		if (!resource) return;

		const contentElementType = CommonCartridgeImportMapper.mapResourceTypeToContentElementType(resource.type);

		if (!contentElementType) return;
		if (!contentElementType) return;

		const resourceBody = this.mapToResourceBody(resource, cardElementProps);
		if (!resourceBody) return;

		const contentElement = await this.cardClient.createCardElement(cardId, {
			type: contentElementType,
		});

		await this.cardClient.updateCardElement(contentElement.id, {
			data: resourceBody,
		});
	}

	private mapToResourceBody(
		resource: CommonCartridgeImportResourceProps,
		cardElementProps: CommonCartridgeImportOrganizationProps
	): UpdateElementContentBodyParamsData | undefined {
		if (resource.type === CommonCartridgeResourceTypeV1P1.WEB_LINK) {
			return this.createLinkFromResource(resource);
		}

		if (
			resource.type === CommonCartridgeResourceTypeV1P1.WEB_CONTENT &&
			cardElementProps.resourcePath.endsWith('.html')
		) {
			return this.createTextFromHtmlResource(resource);
		}

		return undefined;
	}

	private createTextFromHtmlResource(
		resource: CommonCartridgeImportWebContentResourceProps
	): RichTextElementContentBody {
		const richTextBody: RichTextElementContentBody = {
			type: 'richText',
			content: {
				inputFormat: InputFormat.RICH_TEXT_CK4, // TODO use config
				text: resource.html,
			},
		};

		return richTextBody;
	}

	private createLinkFromResource(resource: CommonCartridgeWebLinkResourceProps): LinkElementContentBody {
		const linkBody: LinkElementContentBody = {
			content: {
				title: resource.title ?? resource.url,
				url: resource.url,
				description: '',
				imageUrl: '',
				originalImageUrl: '',
			},
			type: 'link',
		};

		return linkBody;
	}
}
