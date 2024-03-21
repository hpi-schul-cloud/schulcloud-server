import { AuthorizationLoaderService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardDoAuthorizable,
	BoardExternalReferenceType,
	BoardRoles,
	ColumnBoard,
	UserWithBoardRoles,
} from '@shared/domain/domainobject';
import { Course } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { BoardDoRepo } from '../repo';

@Injectable()
export class BoardDoAuthorizableService implements AuthorizationLoaderService {
	constructor(
		@Inject(forwardRef(() => BoardDoRepo)) private readonly boardDoRepo: BoardDoRepo,
		private readonly courseRepo: CourseRepo
	) {}

	async findById(id: EntityId): Promise<BoardDoAuthorizable> {
		const boardDo = await this.boardDoRepo.findById(id, 1);
		const boardDoAuthorizable = await this.getBoardAuthorizable(boardDo);

		return boardDoAuthorizable;
	}

	async getBoardAuthorizable(boardDo: AnyBoardDo): Promise<BoardDoAuthorizable> {
		const rootDo = await this.getRootBoardDo(boardDo);
		// TODO used only for SubmissionItem; for rest BoardDo avoid extra call to improve performance
		const parentDo = await this.getParentDo(boardDo);
		let users: UserWithBoardRoles[] = [];

		if (rootDo.context?.type === BoardExternalReferenceType.Course) {
			const course = await this.courseRepo.findById(rootDo.context.id);
			users = this.mapCourseUsersToUserBoardRoles(course);
		}

		const boardDoAuthorizable = new BoardDoAuthorizable({ users, id: boardDo.id, boardDo, rootDo, parentDo });

		return boardDoAuthorizable;
	}

	private mapCourseUsersToUserBoardRoles(course: Course): UserWithBoardRoles[] {
		const users = [
			...course.getTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR],
				};
			}),
			...course.getSubstitutionTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR],
				};
			}),
			...course.getStudentsList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.READER],
				};
			}),
		];
		// TODO check unique
		return users;
	}

	private async getParentDo(boardDo: AnyBoardDo): Promise<Promise<AnyBoardDo> | undefined> {
		const parentDo = await this.boardDoRepo.findParentOfId(boardDo.id);
		return parentDo;
	}

	// TODO there is a similar method in board-do.service.ts
	private async getRootBoardDo(boardDo: AnyBoardDo): Promise<ColumnBoard> {
		const ancestorIds = await this.boardDoRepo.getAncestorIds(boardDo);
		const ids = [...ancestorIds, boardDo.id];
		const rootId = ids[0];
		const rootBoardDo = await this.boardDoRepo.findById(rootId, 1);

		if (!(rootBoardDo instanceof ColumnBoard)) {
			throw new Error('root boardnode was expected to be a ColumnBoard');
		}

		return rootBoardDo;
	}
}
