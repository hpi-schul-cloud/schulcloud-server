import {
	BoardConfiguration,
	BoardExternalReferenceType,
	BoardRoles,
	ColumnBoard,
	MediaBoard,
	UserWithBoardRoles,
} from '../../../domain';
import { PreparedBoardContext } from './prepared-board-context.interface';

export interface CourseUserInfo {
	userId: string;
	firstName?: string;
	lastName?: string;
}

export interface CourseBoardContextData {
	teachers: CourseUserInfo[];
	substitutionTeachers: CourseUserInfo[];
	students: CourseUserInfo[];
}

/**
 * Prepared context for Course-based boards.
 * Holds pre-fetched course user data.
 */
export class CourseBoardContext implements PreparedBoardContext {
	public readonly type = BoardExternalReferenceType.Course;

	private readonly usersWithBoardRoles: UserWithBoardRoles[];

	private readonly hasTeachers: boolean;

	constructor(private readonly data: CourseBoardContextData) {
		this.usersWithBoardRoles = this.computeUsersWithBoardRoles();
		this.hasTeachers = data.teachers.length > 0;
	}

	public getUsersWithBoardRoles(): UserWithBoardRoles[] {
		return this.usersWithBoardRoles;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getBoardConfiguration(rootNode: MediaBoard | ColumnBoard): BoardConfiguration {
		return {
			canEditorsManageVideoconference: false,
			canReadersEdit: false,
			canAdminsToggleReadersCanEdit: false,
			isLocked: !this.hasTeachers,
		};
	}

	private computeUsersWithBoardRoles(): UserWithBoardRoles[] {
		const teacherRoles: UserWithBoardRoles[] = this.data.teachers.map((user) => {
			return {
				userId: user.userId,
				firstName: user.firstName,
				lastName: user.lastName,
				roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
			};
		});

		const substitutionTeacherRoles: UserWithBoardRoles[] = this.data.substitutionTeachers.map((user) => {
			return {
				userId: user.userId,
				firstName: user.firstName,
				lastName: user.lastName,
				roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
			};
		});

		const studentRoles: UserWithBoardRoles[] = this.data.students.map((user) => {
			return {
				userId: user.userId,
				firstName: user.firstName,
				lastName: user.lastName,
				roles: [BoardRoles.READER],
			};
		});

		return [...teacherRoles, ...substitutionTeacherRoles, ...studentRoles];
	}
}
