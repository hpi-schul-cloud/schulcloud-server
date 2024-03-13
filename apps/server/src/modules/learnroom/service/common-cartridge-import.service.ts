import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { CardService, ColumnBoardService, ColumnService } from '@src/modules/board';
import { CommonCartridgeFileParser } from '@src/modules/common-cartridge/import';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnService: ColumnService,
		private readonly cardService: CardService
	) {}

	public async createCourse(user: User, file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file);
		const course = new Course({ teachers: [user], school: user.school, name: parser.manifest.getTitle() });

		await this.courseService.create(course);
		await this.createColumnBoard(course, parser);
	}

	private async createColumnBoard(course: Course, parser: CommonCartridgeFileParser): Promise<void> {
		const organizations = parser.manifest.getOrganizations();
		const columnBoard = await this.columnBoardService.create(
			{
				type: BoardExternalReferenceType.Course,
				id: course.id,
			},
			parser.manifest.getTitle()
		);

		for (const organization of organizations) {
			if (organization.title === organization.path) {
				// eslint-disable-next-line no-await-in-loop
				const column = await this.columnService.create(columnBoard);

				// eslint-disable-next-line no-await-in-loop
				await this.columnService.updateTitle(column, organization.title);

				const items = organizations.filter(
					(org) => org.path.startsWith(organization.path) && org.path !== organization.path
				);

				for (const item of items) {
					// eslint-disable-next-line no-await-in-loop
					const card = await this.cardService.create(column);

					// eslint-disable-next-line no-await-in-loop
					await this.cardService.updateTitle(card, item.title);
				}
			}
		}
	}
}
