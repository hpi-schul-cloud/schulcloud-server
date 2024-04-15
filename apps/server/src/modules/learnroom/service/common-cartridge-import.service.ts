import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType, BoardLayout, ColumnBoard } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { CardService, ColumnBoardService, ColumnService } from '@src/modules/board';
import {
	CommonCartridgeFileParser,
	DEFAULT_FILE_PARSER_OPTIONS,
	OrganizationProps,
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
		private readonly mapper: CommonCartridgeImportMapper
	) {}

	public async importFile(user: User, file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, {
			maxSearchDepth: 1,
			pathSeparator: DEFAULT_FILE_PARSER_OPTIONS.pathSeparator,
		});
		const course = new Course({ teachers: [user], school: user.school, name: parser.manifest.getTitle() });

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
			parser.manifest.getTitle() || ''
		);

		await this.createColumns(parser, columnBoard);
	}

	private async createColumns(parser: CommonCartridgeFileParser, columnBoard: ColumnBoard): Promise<void> {
		const organizations = parser.manifest.getOrganizations();
		const columns = organizations.filter((organization) => organization.pathDepth === 0);

		for await (const column of columns) {
			await this.createColumn(columnBoard, column, organizations);
		}
	}

	private async createColumn(
		columnBoard: ColumnBoard,
		columnProps: OrganizationProps,
		organizations: OrganizationProps[]
	): Promise<void> {
		const column = await this.columnService.create(columnBoard, this.mapper.mapOrganizationToColumn(columnProps));
		const cardProps = organizations
			.filter((organization) => organization.pathDepth === 1 && organization.path.startsWith(columnProps.identifier))
			.map((organization) => this.mapper.mapOrganizationToCard(organization));

		await this.cardService.createMany(column, cardProps);
	}
}
