import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType, EntityId } from '@shared/domain';
import { ColumnBoardService } from '@src/modules/board';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { AncestorEntityType, AncestorResponse } from '../controller/dto/ancestor.response';

@Injectable()
export class AncestorListResolverService {
	constructor(private readonly columnBoardService: ColumnBoardService, private readonly courseService: CourseService) {}

	async getAncestorsOf(type: AncestorEntityType, id: EntityId): Promise<AncestorResponse[]> {
		switch (type) {
			case AncestorEntityType.COLUMN_BOARD:
				return this.resolveColumnBoard(id);
			case AncestorEntityType.COURSE:
				return this.resolveCourse(id);
			default:
		}

		return [];
	}

	async resolveColumnBoard(id: EntityId): Promise<AncestorResponse[]> {
		const columnBoard = await this.columnBoardService.findById(id);
		if (columnBoard?.context?.type === BoardExternalReferenceType.Course) {
			const ancestors = await this.getAncestorsOf(AncestorEntityType.COURSE, columnBoard.context.id);
			const title = columnBoard.title !== undefined && columnBoard.title !== '' ? columnBoard.title : undefined;
			return [
				...ancestors,
				{
					type: AncestorEntityType.COLUMN_BOARD,
					id,
					text: title,
				},
			];
		}
		return [];
	}

	async resolveCourse(id: EntityId): Promise<AncestorResponse[]> {
		const course = await this.courseService.findById(id);
		if (course === undefined) {
			return [];
		}

		return [
			{
				type: AncestorEntityType.COURSE,
				id,
				text: course.name,
			},
		];
	}
}
