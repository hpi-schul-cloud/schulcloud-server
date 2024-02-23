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
import { DrawingDoRepo } from '../repo/drawing-do.repo';

@Injectable()
export class DrawingDoAuthorizableService implements AuthorizationLoaderService {
	constructor(
		@Inject(forwardRef(() => DrawingDoRepo)) private readonly drawingDoRepo: DrawingDoRepo,
		private readonly courseRepo: CourseRepo
	) {}

	async findById(id: EntityId): Promise<BoardDoAuthorizable> {
		const boardDo = await this.drawingDoRepo.findById(id, 1);
		const boardDoAuthorizable = await this.getBoardAuthorizable(boardDo);

		return boardDoAuthorizable;
	}

	async getBoardAuthorizable(boardDo: AnyBoardDo): Promise<BoardDoAuthorizable> {
		let users: UserWithBoardRoles[] = [];
		const parentDo = await this.getParentDo(boardDo);
		const rootBoardDo = await this.getRootBoardDo(boardDo);

		if (rootBoardDo.context?.type === BoardExternalReferenceType.Course) {
			const course = await this.courseRepo.findById(rootBoardDo.context.id);
			users = this.mapCourseUsersToUserBoardRoles(course);
		}

		const boardDoAuthorizable = new BoardDoAuthorizable({ users, id: boardDo.id, boardDo, parentDo });

		return boardDoAuthorizable;
	}

	private mapCourseUsersToUserBoardRoles(course: Course): UserWithBoardRoles[] {
		const users = [
			...course.getTeachersList().map((user) => {
				return {
					userId: user.id,
					roles: [BoardRoles.EDITOR],
					firstName: user.firstName,
					lastName: user.lastName,
				};
			}),
			...course.getStudentsList().map((user) => {
				return {
					userId: user.id,
					roles: [BoardRoles.EDITOR],
					firstName: user.firstName,
					lastName: user.lastName,
				};
			}),
			...course.getSubstitutionTeachersList().map((user) => {
				return {
					userId: user.id,
					roles: [BoardRoles.EDITOR],
					firstName: user.firstName,
					lastName: user.lastName,
				};
			}),
		];
		return users;
	}

	private async getParentDo(boardDo: AnyBoardDo): Promise<Promise<AnyBoardDo> | undefined> {
		const parentDo = await this.drawingDoRepo.findParentOfId(boardDo.id);
		return parentDo;
	}

	private async getRootBoardDo(boardDo: AnyBoardDo): Promise<ColumnBoard> {
		const ancestorIds = await this.drawingDoRepo.getAncestorIds(boardDo);
		const allIds = [...ancestorIds, boardDo.id];
		const rootId = allIds[0];
		const rootBoardDo = await this.drawingDoRepo.findById(rootId, 1);

		if (!(rootBoardDo instanceof ColumnBoard)) {
			throw new Error('root boardnode was expected to be a ColumnBoard');
		}

		return rootBoardDo;
	}
}
