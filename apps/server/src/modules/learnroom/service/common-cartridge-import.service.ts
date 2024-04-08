import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType, Column, ColumnBoard, LinkElement } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { CardService, ColumnBoardService, ColumnService, ContentElementService } from '@src/modules/board';
import {
	CommonCartridgeFileParser,
	DEFAULT_FILE_PARSER_OPTIONS,
	OrganizationProps,
} from '@src/modules/common-cartridge';
import { WebLinkResourceProps } from '@src/modules/common-cartridge/import/common-cartridge-import.types';
import { ObjectId } from 'bson';
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
			parser.manifest.getTitle()
		);

		await this.createColumns(parser, columnBoard);
	}

	private async createColumns(parser: CommonCartridgeFileParser, columnBoard: ColumnBoard): Promise<void> {
		const organizations = parser.manifest.getOrganizations();
		const columns = organizations.filter((organization) => organization.pathDepth === 0);

		for await (const column of columns) {
			await this.createColumn(parser, columnBoard, column, organizations);
		}
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		columnBoard: ColumnBoard,
		columnProps: OrganizationProps,
		organizations: OrganizationProps[]
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
		cardProps: OrganizationProps
	): Promise<void> {
		const resource = parser.getResource(cardProps);
		await this.cardService.create(
			column,
			undefined,
			this.mapper.mapOrganizationToCard(cardProps, [
				new LinkElement({
					id: new ObjectId().toHexString(),
					createdAt: new Date(),
					updatedAt: new Date(),
					title: (resource as WebLinkResourceProps).title,
					url: (resource as WebLinkResourceProps).url,
				}),
			])
		);
		// const resource = parser.getResource(cardProps);

		// if (resource?.type === ResourceType.WEB_LINK) {
		// 	const link = (await this.contentElementService.create(card, ContentElementType.LINK)) as LinkElement;
		// 	const updatedLink = new LinkContentBody();

		// 	updatedLink.title = resource.title;
		// 	updatedLink.url = resource.url;

		// 	await this.contentElementService.update(link, link);
		// }
	}
}
