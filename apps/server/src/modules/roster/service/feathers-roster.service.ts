import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { Pseudonym } from '@modules/pseudonym/repo';
import { PseudonymService } from '@modules/pseudonym/service';
import { RoleName } from '@modules/role';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool/service';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleReference } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '../../board';
import { ExternalToolElement } from '../../board/domain';
import { RosterConfig } from '../roster.config';

interface UserMetadata {
	data: {
		user_id: string;
		username: string;
		type: string;
	};
}

interface UserGroups {
	data: {
		groups: UserGroup[];
	};
}

interface UserGroup {
	group_id: string;
	name: string;
	student_count: number;
}

interface UserData {
	user_id: string;
	username: string;
}

interface Group {
	data: {
		students: UserData[];
		teachers: UserData[];
	};
}

/**
 * Please do not use this service in any other nest modules.
 * This service will be called from feathers to get the roster data for ctl pseudonyms {@link ExternalToolPseudonymEntity}.
 * These data will be used e.g. by bettermarks to resolve and display the usernames.
 */
@Injectable() // Why Feathers in name?
export class FeathersRosterService {
	constructor(
		private readonly userService: UserService,
		private readonly pseudonymService: PseudonymService,
		private readonly courseService: CourseService,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly configService: ConfigService<RosterConfig, true>
	) {}

	public async getUsersMetadata(pseudonym: string): Promise<UserMetadata> {
		const loadedPseudonym = await this.findPseudonymByPseudonym(pseudonym);
		const user = await this.userService.findById(loadedPseudonym.userId);

		const userMetadata: UserMetadata = {
			data: {
				user_id: user.id as string,
				username: this.pseudonymService.getIframeSubject(loadedPseudonym.pseudonym),
				type: this.getUserRole(user),
			},
		};

		return userMetadata;
	}

	public async getUserGroups(pseudonym: string, oauth2ClientId: string): Promise<UserGroups> {
		const courses = await this.getCourses(pseudonym, oauth2ClientId);

		const userGroups = {
			data: {
				groups: courses.map((course) => {
					return {
						group_id: course.id,
						name: course.name,
						student_count: course.students.length,
					};
				}),
			},
		};

		return userGroups;
	}

	private async getCourses(pseudonym: string, oauth2ClientId: string): Promise<CourseEntity[]> {
		const pseudonymContext = await this.findPseudonymByPseudonym(pseudonym);
		const user = await this.userService.findById(pseudonymContext.userId);

		const externalTool = await this.validateAndGetExternalTool(oauth2ClientId);
		const schoolExternalTool = await this.validateSchoolExternalTool(user.schoolId, externalTool.id);

		let courses = await this.courseService.findAllByUserId(pseudonymContext.userId);
		courses = await this.filterCoursesByToolAvailability(courses, schoolExternalTool);

		return courses;
	}

	public async getGroup(courseId: EntityId, oauth2ClientId: string): Promise<Group> {
		const course: CourseEntity = await this.courseService.findById(courseId);

		const externalTool = await this.validateAndGetExternalTool(oauth2ClientId);
		const schoolExternalTool = await this.validateSchoolExternalTool(course.school.id, externalTool.id);
		await this.validateContextExternalTools(course, schoolExternalTool);

		const [studentEntities, teacherEntities, substitutionTeacherEntities] = await Promise.all([
			course.students.loadItems(),
			course.teachers.loadItems(),
			course.substitutionTeachers.loadItems(),
		]);

		const [students, teachers, substitutionTeachers] = await Promise.all([
			Promise.all(studentEntities.map((user) => this.userService.findById(user.id))),
			Promise.all(teacherEntities.map((user) => this.userService.findById(user.id))),
			Promise.all(substitutionTeacherEntities.map((user) => this.userService.findById(user.id))),
		]);

		const [studentPseudonyms, teacherPseudonyms, substitutionTeacherPseudonyms] = await Promise.all([
			this.getAndPseudonyms(students, externalTool),
			this.getAndPseudonyms(teachers, externalTool),
			this.getAndPseudonyms(substitutionTeachers, externalTool),
		]);

		const allTeacherPseudonyms = teacherPseudonyms.concat(substitutionTeacherPseudonyms);

		const group = {
			data: {
				students: studentPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
				teachers: allTeacherPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
			},
		};

		return group;
	}

	private async getAndPseudonyms(users: UserDo[], externalTool: ExternalTool): Promise<Pseudonym[]> {
		const pseudonyms: Pseudonym[] = await Promise.all(
			users.map((user: UserDo) => this.pseudonymService.findOrCreatePseudonym(user, externalTool))
		);

		return pseudonyms;
	}

	private getUserRole(user: UserDo): string {
		const roleName = user.roles.some((role: RoleReference) => role.name === RoleName.TEACHER)
			? RoleName.TEACHER
			: RoleName.STUDENT;

		return roleName;
	}

	private async findPseudonymByPseudonym(pseudonym: string): Promise<Pseudonym> {
		const loadedPseudonym = await this.pseudonymService.findPseudonymByPseudonym(pseudonym);

		if (!loadedPseudonym) {
			throw new NotFoundLoggableException(Pseudonym.name, { pseudonym });
		}

		return loadedPseudonym;
	}

	private async filterCoursesByToolAvailability(
		courses: CourseEntity[],
		schoolExternalTool: SchoolExternalTool
	): Promise<CourseEntity[]> {
		const validCourses: CourseEntity[] = [];

		await Promise.all(
			courses.map(async (course: CourseEntity): Promise<void> => {
				const isExternalToolReferencedInCourse: boolean = await this.isExternalToolReferencedInCourse(
					course,
					schoolExternalTool
				);

				if (isExternalToolReferencedInCourse) {
					validCourses.push(course);
				}
			})
		);

		return validCourses;
	}

	private async isExternalToolReferencedInCourse(
		course: CourseEntity,
		schoolExternalTool: SchoolExternalTool
	): Promise<boolean> {
		const contextExternalToolsInCourse: ContextExternalTool[] =
			await this.contextExternalToolService.findContextExternalTools({
				context: {
					id: course.id,
					type: ToolContextType.COURSE,
				},
				schoolToolRef: {
					schoolToolId: schoolExternalTool.id,
				},
			});

		if (contextExternalToolsInCourse.length > 0) {
			return true;
		}

		if (this.configService.get<boolean>('FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED')) {
			const columnBoards: ColumnBoard[] = await this.columnBoardService.findByExternalReference({
				type: BoardExternalReferenceType.Course,
				id: course.id,
			});

			const isExternalToolReferencedInColumnBoard: boolean[] = await Promise.all(
				columnBoards.map(
					async (columnBoard: ColumnBoard): Promise<boolean> =>
						this.isExternalToolReferencedInColumnBoard(columnBoard, schoolExternalTool)
				)
			);

			if (isExternalToolReferencedInColumnBoard.some(Boolean)) {
				return true;
			}
		}

		return false;
	}

	private async isExternalToolReferencedInColumnBoard(
		columnBoard: ColumnBoard,
		schoolExternalTool: SchoolExternalTool
	): Promise<boolean> {
		const elements = columnBoard.getChildrenOfType(ExternalToolElement);

		const hasRequestedTool = await Promise.all(
			elements.map(async (element: ExternalToolElement): Promise<boolean> => {
				if (!element.contextExternalToolId) {
					return false;
				}

				const contextExternalTool = await this.contextExternalToolService.findById(element.contextExternalToolId);

				const isRequestedTool = contextExternalTool?.schoolToolRef.schoolToolId === schoolExternalTool.id;

				return isRequestedTool;
			})
		);

		const hasTool = hasRequestedTool.some(Boolean);

		return hasTool;
	}

	private async validateAndGetExternalTool(oauth2ClientId: string): Promise<ExternalTool> {
		const externalTool = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(oauth2ClientId);

		if (!externalTool || !externalTool.id || externalTool.isDeactivated) {
			throw new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': oauth2ClientId });
		}

		return externalTool;
	}

	private async validateSchoolExternalTool(schoolId: EntityId, toolId: string): Promise<SchoolExternalTool> {
		const schoolExternalTools = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId,
			toolId,
			isDeactivated: false,
		});

		if (schoolExternalTools.length === 0) {
			throw new NotFoundLoggableException(SchoolExternalTool.name, { toolId });
		}

		return schoolExternalTools[0];
	}

	private async validateContextExternalTools(
		course: CourseEntity,
		schoolExternalTool: SchoolExternalTool
	): Promise<void> {
		const isExternalToolReferencedInCourse = await this.isExternalToolReferencedInCourse(course, schoolExternalTool);

		if (!isExternalToolReferencedInCourse) {
			throw new NotFoundLoggableException(ContextExternalTool.name, { contextId: course.id });
		}
	}

	private mapPseudonymToUserData(pseudonym: Pseudonym): UserData {
		const userData = {
			user_id: pseudonym.pseudonym,
			username: this.pseudonymService.getIframeSubject(pseudonym.pseudonym),
		};

		return userData;
	}
}
