import {
	BoardExternalReferenceType,
	BoardLayout,
	BoardNodeFactory,
	BoardNodeService,
	Card,
	Column,
	ColumnBoard,
	ContentElementType,
} from '@modules/board';
import {
	CommonCartridgeFileParser,
	CommonCartridgeImportOrganizationProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from '@modules/common-cartridge';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeImportMapper } from '../mapper/common-cartridge-import.mapper';

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly boardNodeService: BoardNodeService,
		private readonly mapper: CommonCartridgeImportMapper
	) {}

	public async importFile(user: User, file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);
		const course = new CourseEntity({ teachers: [user], school: user.school, name: parser.getTitle() });

		await this.courseService.create(course);
		await this.createColumnBoards(parser, course);
	}

	private async createColumnBoards(parser: CommonCartridgeFileParser, course: CourseEntity): Promise<void> {
		const organizations = parser.getOrganizations();
		const boards = organizations.filter((organization) => organization.pathDepth === 0);

		for await (const board of boards) {
			await this.createColumnBoard(parser, course, board, organizations);
		}
	}

	private async createColumnBoard(
		parser: CommonCartridgeFileParser,
		course: CourseEntity,
		boardProps: CommonCartridgeImportOrganizationProps,
		organizations: CommonCartridgeImportOrganizationProps[]
	): Promise<void> {
		const columnsTitleCounter = 0;
		const columnBoard = this.boardNodeFactory.buildColumnBoard({
			context: {
				type: BoardExternalReferenceType.Course,
				id: course.id,
			},
			layout: BoardLayout.COLUMNS,
			title: boardProps.title === '' ? 'Importiertes Spaltenboard' : boardProps.title,
		});
		await this.boardNodeService.addRoot(columnBoard);

		await this.createColumns(parser, columnBoard, boardProps, organizations, columnsTitleCounter);
	}

	private async createColumns(
		parser: CommonCartridgeFileParser,
		columnBoard: ColumnBoard,
		boardProps: CommonCartridgeImportOrganizationProps,
		organizations: CommonCartridgeImportOrganizationProps[],
		counter: number
	): Promise<void> {
		const columnsWithResource = organizations.filter(
			(organization) =>
				organization.pathDepth === 1 && organization.path.startsWith(boardProps.identifier) && organization.isResource
		);

		for await (const columnWithResource of columnsWithResource) {
			counter += 1;
			await this.createColumnWithResource(parser, columnBoard, columnWithResource, counter);
		}

		const columnsWithoutResource = organizations.filter(
			(organization) =>
				organization.pathDepth === 1 && organization.path.startsWith(boardProps.identifier) && !organization.isResource
		);

		for await (const columnWithoutResource of columnsWithoutResource) {
			counter += 1;
			await this.createColumn(parser, columnBoard, columnWithoutResource, organizations, counter);
		}
	}

	private async createColumnWithResource(
		parser: CommonCartridgeFileParser,
		columnBoard: ColumnBoard,
		columnProps: CommonCartridgeImportOrganizationProps,
		counter: number
	): Promise<void> {
		const column = this.boardNodeFactory.buildColumn();
		column.title = `${counter}`;
		await this.boardNodeService.addToParent(columnBoard, column);
		await this.createCardWithElement(parser, column, columnProps);
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		columnBoard: ColumnBoard,
		columnProps: CommonCartridgeImportOrganizationProps,
		organizations: CommonCartridgeImportOrganizationProps[],
		counter: number
	): Promise<void> {
		const column = this.boardNodeFactory.buildColumn();
		await this.boardNodeService.addToParent(columnBoard, column);
		column.title = `${counter}`;

		const cards = organizations.filter(
			(organization) => organization.pathDepth === 2 && organization.path.startsWith(columnProps.path)
		);

		const cardsWithResource = cards.filter((card) => card.isResource);

		for await (const card of cardsWithResource) {
			await this.createCardWithElement(parser, column, card);
		}

		const cardsWithoutResource = cards.filter((card) => !card.isResource);

		for await (const card of cardsWithoutResource) {
			await this.createCard(parser, column, card, organizations);
		}
	}

	private async createCardWithElement(
		parser: CommonCartridgeFileParser,
		column: Column,
		cardProps: CommonCartridgeImportOrganizationProps
	): Promise<void> {
		const card = this.boardNodeFactory.buildCard();
		const { title } = this.mapper.mapOrganizationToCard(cardProps);
		card.title = title;
		await this.boardNodeService.addToParent(column, card);
		const resource = parser.getResource(cardProps);
		const contentElementType = this.mapper.mapResourceTypeToContentElementType(resource?.type);

		if (resource && contentElementType) {
			const contentElement = this.boardNodeFactory.buildContentElement(contentElementType);
			await this.boardNodeService.addToParent(card, contentElement);
			const contentElementBody = this.mapper.mapResourceToContentElementBody(resource);

			await this.boardNodeService.updateContent(contentElement, contentElementBody);
		}
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: Column,
		cardProps: CommonCartridgeImportOrganizationProps,
		organizations: CommonCartridgeImportOrganizationProps[]
	): Promise<void> {
		const card = this.boardNodeFactory.buildCard();
		const { title } = this.mapper.mapOrganizationToCard(cardProps);
		card.title = title;
		await this.boardNodeService.addToParent(column, card);

		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= 3 && organization.path.startsWith(cardProps.path)
		);

		for await (const cardElement of cardElements) {
			await this.createCardElement(parser, card, cardElement);
		}
	}

	private async createCardElement(
		parser: CommonCartridgeFileParser,
		card: Card,
		cardElementProps: CommonCartridgeImportOrganizationProps
	): Promise<void> {
		if (cardElementProps.isResource) {
			const resource = parser.getResource(cardElementProps);
			const contentElementType = this.mapper.mapResourceTypeToContentElementType(resource?.type);

			if (resource && contentElementType) {
				const contentElement = this.boardNodeFactory.buildContentElement(contentElementType);
				await this.boardNodeService.addToParent(card, contentElement);
				const contentElementBody = this.mapper.mapResourceToContentElementBody(resource);
				await this.boardNodeService.updateContent(contentElement, contentElementBody);
			}
		} else {
			const contentElement = this.boardNodeFactory.buildContentElement(ContentElementType.RICH_TEXT);
			await this.boardNodeService.addToParent(card, contentElement);
			const contentElementBody = this.mapper.mapOrganizationToTextElement(cardElementProps);

			await this.boardNodeService.updateContent(contentElement, contentElementBody);
		}
	}
}
