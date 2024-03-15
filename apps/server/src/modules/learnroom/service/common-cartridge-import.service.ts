import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { ColumnBoardService, ColumnService } from '@src/modules/board';
import { CommonCartridgeFileParser, DEFAULT_FILE_PARSER_OPTIONS } from '@src/modules/common-cartridge';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnService: ColumnService
	) {}

	public async importFile(user: User, file: Buffer): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, {
			maxSearchDepth: 1,
			pathSeparator: DEFAULT_FILE_PARSER_OPTIONS.pathSeparator,
		});
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
		const columnProps = organizations.map((organization) => {
			return { title: organization.title };
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const columns = await this.columnService.createMany(columnBoard, columnProps);
	}
}
