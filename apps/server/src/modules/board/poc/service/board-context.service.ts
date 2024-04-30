import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { AnyBoardNode, BoardExternalReferenceType, BoardRoles, UserWithBoardRoles } from '../domain';

@Injectable()
export class BoardContextService {
	constructor(@Inject() private readonly courseRepo: CourseRepo) {}

	async getUsersWithBoardRoles(rootNode: AnyBoardNode): Promise<UserWithBoardRoles[]> {
		if (!('context' in rootNode)) {
			throw new Error(`Board root id '${rootNode.id}' doesn't provide a context`);
		}

		let usersWithRoles: UserWithBoardRoles[] = [];

		if (rootNode.context.type === BoardExternalReferenceType.Course)
			usersWithRoles = await this.getFromCourse(rootNode.context.id);
		else if (rootNode.context.type === BoardExternalReferenceType.User) {
			usersWithRoles = this.getFromUser(rootNode.context.id);
		}

		return usersWithRoles;
	}

	private async getFromCourse(courseId: EntityId): Promise<UserWithBoardRoles[]> {
		const course = await this.courseRepo.findById(courseId);
		const usersWithRoles: UserWithBoardRoles[] = [
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

		return usersWithRoles;
	}

	private getFromUser(userId: EntityId): UserWithBoardRoles[] {
		const usersWithRoles: UserWithBoardRoles[] = [
			{
				userId,
				roles: [BoardRoles.EDITOR],
			},
		];

		return usersWithRoles;
	}
}
