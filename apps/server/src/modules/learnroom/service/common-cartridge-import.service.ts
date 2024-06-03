import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType, BoardLayout, Column, ColumnBoard } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { CardService, ColumnBoardService, ColumnService, ContentElementService } from '@src/modules/board';
import {
	CommonCartridgeFileParser,
	CommonCartridgeOrganizationProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from '@src/modules/common-cartridge';
import { CommonCartridgeImportMapper } from '../mapper/common-cartridge-import.mapper';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnService: ColumnService,
		private readonly cardService: CardService,
		private readonly contentElementService: ContentElementService,
		private readonly mapper: CommonCartridgeImportMapper
	) {}

	public async importFile(user: User, file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);
		const course = new Course({ teachers: [user], school: user.school, name: parser.getTitle() });

		await this.courseService.create(course);
		await this.createColumnBoards(parser, course);
	}

	private async createColumnBoards(parser: CommonCartridgeFileParser, course: Course): Promise<void> {
		const organizations = parser.getOrganizations();
		const boards = organizations.filter((organization) => organization.pathDepth === 0);

		for await (const board of boards) {
			await this.createColumnBoard(parser, course, board, organizations);
		}
	}

	private async createColumnBoard(
		parser: CommonCartridgeFileParser,
		course: Course,
		boardProps: CommonCartridgeOrganizationProps,
		organizations: CommonCartridgeOrganizationProps[]
	): Promise<void> {
		const columnBoard = await this.columnBoardService.create(
			{
				type: BoardExternalReferenceType.Course,
				id: course.id,
			},
			BoardLayout.COLUMNS,
			boardProps.title || ''
		);

		await this.createColumns(parser, columnBoard, boardProps, organizations);
	}

	private async createColumns(
		parser: CommonCartridgeFileParser,
		columnBoard: ColumnBoard,
		boardProps: CommonCartridgeOrganizationProps,
		organizations: CommonCartridgeOrganizationProps[]
	): Promise<void> {
		const columnsWithResource = organizations.filter(
			(organization) =>
				organization.pathDepth === 1 && organization.path.startsWith(boardProps.identifier) && organization.isResource
		);

		for await (const columnWithResource of columnsWithResource) {
			await this.createColumnWithResource(parser, columnBoard, columnWithResource);
		}

		const columnsWithoutResource = organizations.filter(
			(organization) =>
				organization.pathDepth === 1 && organization.path.startsWith(boardProps.identifier) && !organization.isResource
		);

		for await (const columnWithoutResource of columnsWithoutResource) {
			await this.createColumn(parser, columnBoard, columnWithoutResource, organizations);
		}
	}

	private async createColumnWithResource(
		parser: CommonCartridgeFileParser,
		columnBoard: ColumnBoard,
		columnProps: CommonCartridgeOrganizationProps
	): Promise<void> {
		const column = await this.columnService.create(columnBoard, this.mapper.mapOrganizationToColumn(columnProps));
		await this.createCard(parser, column, columnProps, false);
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		columnBoard: ColumnBoard,
		columnProps: CommonCartridgeOrganizationProps,
		organizations: CommonCartridgeOrganizationProps[]
	): Promise<void> {
		const column = await this.columnService.create(columnBoard, this.mapper.mapOrganizationToColumn(columnProps));
		const cards = organizations.filter(
			(organization) =>
				organization.pathDepth >= 2 && organization.path.startsWith(columnProps.path) && organization.isResource
		);

		for await (const card of cards) {
			await this.createCard(parser, column, card, true);
		}
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: Column,
		cardProps: CommonCartridgeOrganizationProps,
		withTitle = true
	): Promise<void> {
		const card = await this.cardService.create(
			column,
			undefined,
			this.mapper.mapOrganizationToCard(cardProps, withTitle)
		);
		const resource = parser.getResource(cardProps);
		const contentElementType = this.mapper.mapResourceTypeToContentElementType(resource?.type);

		if (resource && contentElementType) {
			const contentElement = await this.contentElementService.create(card, contentElementType);
			const contentElementBody = this.mapper.mapResourceToContentElementBody(resource);

			await this.contentElementService.update(contentElement, contentElementBody);
		}
	}
}
