import { Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardDoAuthorizable,
	BoardExternalReferenceType,
	BoardRoles,
	ColumnBoard,
	Course,
	EntityId,
	UserBoardRoles,
} from '@shared/domain';
import { AuthorizationLoaderService } from '@src/modules/authorization';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { BoardDoRepo } from '../repo';

@Injectable()
export class BoardDoAuthorizableService implements AuthorizationLoaderService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly courseService: CourseService) {}

	async findById(id: EntityId): Promise<BoardDoAuthorizable> {
		const boardDo = await this.boardDoRepo.findById(id, 1);
		const { users } = await this.getBoardAuthorizable(boardDo);
		const boardDoAuthorizable = new BoardDoAuthorizable(users, id);

		return boardDoAuthorizable;
	}

	async getBoardAuthorizable(boardDo: AnyBoardDo): Promise<BoardDoAuthorizable> {
		const ancestorIds = await this.boardDoRepo.getAncestorIds(boardDo);
		const ids = [...ancestorIds, boardDo.id];
		const rootId = ids[0];
		const rootBoardDo = await this.boardDoRepo.findById(rootId, 1);
		if (rootBoardDo instanceof ColumnBoard) {
			if (rootBoardDo.context.type === BoardExternalReferenceType.Course) {
				const course = await this.courseService.findById(rootBoardDo.context.id);
				const users = this.mapCourseUsersToUsergroup(course);
				return { users, id: boardDo.id };
			}
		} else {
			throw new Error('root boardnode was expected to be a ColumnBoard');
		}

		return { users: [], id: boardDo.id };
	}

	private mapCourseUsersToUsergroup(course: Course): UserBoardRoles[] {
		const users = [
			...course.getTeacherIds().map((userId) => {
				return { userId, roles: [BoardRoles.EDITOR] };
			}),
			...course.getSubstitutionTeacherIds().map((userId) => {
				return { userId, roles: [BoardRoles.EDITOR] };
			}),
			...course.getStudentIds().map((userId) => {
				return { userId, roles: [BoardRoles.READER] };
			}),
		];
		return users;
	}
}
