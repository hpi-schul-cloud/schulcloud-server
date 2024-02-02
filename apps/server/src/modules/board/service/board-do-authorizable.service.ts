import { AuthorizationLoaderService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardDoAuthorizable,
	BoardExternalReferenceType,
	BoardRoles,
	ColumnBoard,
	isDrawingElement,
	UserBoardRoles,
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
		const rootBoardDo = await this.getRootBoardDo(boardDo);
		let users: UserBoardRoles[] = [];

		if (rootBoardDo.context?.type === BoardExternalReferenceType.Course) {
			const course = await this.courseRepo.findById(rootBoardDo.context.id);
			// TODO find a better way to handle authorization depending on BoardDo type
			const isDrawing = isDrawingElement(boardDo);
			users = this.mapCourseUsersToUserBoardRoles(course, isDrawing);
		}

		const boardDoAuthorizable = new BoardDoAuthorizable({ users, id: boardDo.id });

		return boardDoAuthorizable;
	}

	private mapCourseUsersToUserBoardRoles(course: Course, isDrawing: boolean): UserBoardRoles[] {
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
					// TODO: fix this temporary hack allowing students to upload files to the DrawingElement
					// linked with getElementWithWritePermission method in element.uc.ts
					// this is needed to allow students to upload/delete files to/from the tldraw whiteboard (DrawingElement)
					roles: isDrawing ? [BoardRoles.EDITOR] : [BoardRoles.READER],
				};
			}),
		];
		// TODO check unique
		return users;
	}

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
