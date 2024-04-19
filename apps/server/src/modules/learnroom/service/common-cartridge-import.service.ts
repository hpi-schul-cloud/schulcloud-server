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
		const parser = new CommonCartridgeFileParser(file, {
			maxSearchDepth: 1,
			pathSeparator: DEFAULT_FILE_PARSER_OPTIONS.pathSeparator,
		});
		const course = new Course({ teachers: [user], school: user.school, name: parser.getTitle() });

		await this.courseService.create(course);
		await this.createColumnBoard(parser, course);
	}

	private async createColumnBoard(parser: CommonCartridgeFileParser, course: Course): Promise<void> {
		const columnBoard = await this.columnBoardService.create(
			{
				type: BoardExternalReferenceType.Course,
				id: course.id,
			},
			BoardLayout.COLUMNS,
			parser.getTitle() || ''
		);

		await this.createColumns(parser, columnBoard);
	}

	private async createColumns(parser: CommonCartridgeFileParser, columnBoard: ColumnBoard): Promise<void> {
		const organizations = parser.getOrganizations();
		const columns = organizations.filter((organization) => organization.pathDepth === 0);

		for await (const column of columns) {
			await this.createColumn(parser, columnBoard, column, organizations);
		}
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
				organization.pathDepth === 1 && organization.path.startsWith(columnProps.identifier) && organization.isResource
		);

		for await (const card of cards) {
			await this.createCard(parser, column, card);
		}
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: Column,
		cardProps: CommonCartridgeOrganizationProps
	): Promise<void> {
		const card = await this.cardService.create(column, undefined, this.mapper.mapOrganizationToCard(cardProps));
		const resource = parser.getResource(cardProps);
		const contentElementType = this.mapper.mapResourceTypeToContentElementType(resource?.type);

		if (resource && contentElementType) {
			const contentElement = await this.contentElementService.create(card, contentElementType);
			const contentElementBody = this.mapper.mapResourceToContentElementBody(resource);

			await this.contentElementService.update(contentElement, contentElementBody);
		}
	}
}
