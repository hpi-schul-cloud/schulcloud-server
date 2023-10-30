import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ColumnBoard } from '@shared/domain/domainobject/board/column-board.do';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import {
	BoardDoAuthorizable,
	BoardRoles,
	UserBoardRoles,
	UserRoleEnum,
} from '@shared/domain/domainobject/board/types/board-do-authorizable';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { Course } from '@shared/domain/entity/course.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { AuthorizationLoaderService } from '@src/modules/authorization/types/authorization-loader-service';
import { BoardDoRepo } from '../repo/board-do.repo';

@Injectable()
export class BoardDoAuthorizableService implements AuthorizationLoaderService {
	constructor(
		@Inject(forwardRef(() => BoardDoRepo)) private readonly boardDoRepo: BoardDoRepo,
		private readonly courseRepo: CourseRepo
	) {}

	async findById(id: EntityId): Promise<BoardDoAuthorizable> {
		const boardDo = await this.boardDoRepo.findById(id, 1);
		const { users } = await this.getBoardAuthorizable(boardDo);
		const boardDoAuthorizable = new BoardDoAuthorizable({ users, id });

		return boardDoAuthorizable;
	}

	async getBoardAuthorizable(boardDo: AnyBoardDo): Promise<BoardDoAuthorizable> {
		const ancestorIds = await this.boardDoRepo.getAncestorIds(boardDo);
		const ids = [...ancestorIds, boardDo.id];
		const rootId = ids[0];
		const rootBoardDo = await this.boardDoRepo.findById(rootId, 1);
		if (rootBoardDo instanceof ColumnBoard) {
			if (rootBoardDo.context?.type === BoardExternalReferenceType.Course) {
				const course = await this.courseRepo.findById(rootBoardDo.context.id);
				const users = this.mapCourseUsersToUsergroup(course);
				return new BoardDoAuthorizable({ users, id: boardDo.id });
			}
		} else {
			throw new Error('root boardnode was expected to be a ColumnBoard');
		}

		return new BoardDoAuthorizable({ users: [], id: boardDo.id });
	}

	private mapCourseUsersToUsergroup(course: Course): UserBoardRoles[] {
		const users = [
			...course.getTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR],
					userRoleEnum: UserRoleEnum.TEACHER,
				};
			}),
			...course.getSubstitutionTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR],
					userRoleEnum: UserRoleEnum.SUBSTITUTION_TEACHER,
				};
			}),
			...course.getStudentsList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.READER],
					userRoleEnum: UserRoleEnum.STUDENT,
				};
			}),
		];
		return users;
	}
}
