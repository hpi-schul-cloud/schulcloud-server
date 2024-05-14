import {
	BoardExternalReferenceType,
	BoardLayout,
	BoardNodeFactory,
	BoardNodeService,
	Column,
	ColumnBoard,
	ContentElementUpdateService,
} from '@modules/board';
import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
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
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly boardNodeService: BoardNodeService,
		private readonly contentElementUpdateService: ContentElementUpdateService,
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
		const columnBoard = this.boardNodeFactory.buildColumnBoard({
			context: { type: BoardExternalReferenceType.Course, id: course.id },
			title: parser.getTitle() || '',
			layout: BoardLayout.COLUMNS,
		});

		await this.boardNodeService.addRoot(columnBoard);

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
		const column = this.boardNodeFactory.buildColumn();
		column.title = columnProps.title;
		await this.boardNodeService.addToParent(columnBoard, column);

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
		const card = this.boardNodeFactory.buildCard();
		card.title = cardProps.title;
		await this.boardNodeService.addToParent(column, card);

		const resource = parser.getResource(cardProps);
		const contentElementType = this.mapper.mapResourceTypeToContentElementType(resource?.type);

		if (resource && contentElementType) {
			const contentElement = this.boardNodeFactory.buildContentElement(contentElementType);
			await this.boardNodeService.addToParent(card, contentElement);
			const contentElementBody = this.mapper.mapResourceToContentElementBody(resource);
			await this.contentElementUpdateService.updateContent(contentElement, contentElementBody);
		}
	}
}
