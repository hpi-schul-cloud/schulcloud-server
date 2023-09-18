import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Course, EntityId, Pseudonym, RoleName, RoleReference, UserDO } from '@shared/domain';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { ToolContextType } from '@src/modules/tool/common/enum';
import { ContextExternalTool, ContextRef } from '@src/modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@src/modules/tool/context-external-tool/service';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { ExternalToolService } from '@src/modules/tool/external-tool/service';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@src/modules/tool/school-external-tool/service';
import { UserService } from '@src/modules/user';
import { PseudonymService } from './pseudonym.service';

interface UserMetdata {
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
@Injectable()
export class FeathersRosterService {
	constructor(
		private readonly userService: UserService,
		private readonly pseudonymService: PseudonymService,
		private readonly courseService: CourseService,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	async getUsersMetadata(pseudonym: string): Promise<UserMetdata> {
		const loadedPseudonym: Pseudonym = await this.findPseudonymByPseudonym(pseudonym);
		const user: UserDO = await this.userService.findById(loadedPseudonym.userId);

		const userMetadata: UserMetdata = {
			data: {
				user_id: user.id as string,
				username: this.pseudonymService.getIframeSubject(loadedPseudonym.pseudonym),
				type: this.getUserRole(user),
			},
		};

		return userMetadata;
	}

	async getUserGroups(pseudonym: string, externalToolId: string): Promise<UserGroups> {
		const loadedPseudonym: Pseudonym = await this.findPseudonymByPseudonym(pseudonym);

		let courses: Course[] = await this.getCoursesFromUsersPseudonym(loadedPseudonym);
		courses = await this.filterCoursesByToolAvailability(courses, externalToolId);

		const userGroups: UserGroups = {
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

	async getGroup(courseId: EntityId, oauth2ClientId: string): Promise<Group> {
		const course: Course = await this.courseService.findById(courseId);
		const externalTool: ExternalTool = await this.validateAndGetExternalTool(oauth2ClientId);

		await this.validateSchoolExternalTool(course.school.id, externalTool.id as string);
		await this.validateContextExternalTools(courseId);

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
			Promise.all(students.map((user: UserDO) => this.pseudonymService.findByUserAndTool(user, externalTool))),
			Promise.all(teachers.map((user: UserDO) => this.pseudonymService.findByUserAndTool(user, externalTool))),
			Promise.all(
				substitutionTeachers.map((user: UserDO) => this.pseudonymService.findByUserAndTool(user, externalTool))
			),
		]);

		const allTeacherPseudonyms = teacherPseudonyms.concat(substitutionTeacherPseudonyms);

		const group: Group = {
			data: {
				students: studentPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
				teachers: allTeacherPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
			},
		};

		return group;
	}

	private getUserRole(user: UserDO): string {
		const roleName = user.roles.some((role: RoleReference) => role.name === RoleName.TEACHER)
			? RoleName.TEACHER
			: RoleName.STUDENT;

		return roleName;
	}

	private async findPseudonymByPseudonym(pseudonym: string): Promise<Pseudonym> {
		const loadedPseudonym: Pseudonym | null = await this.pseudonymService.findPseudonymByPseudonym(pseudonym);

		if (!loadedPseudonym) {
			throw new NotFoundLoggableException(Pseudonym.name, 'pseudonym', pseudonym);
		}

		return loadedPseudonym;
	}

	private async getCoursesFromUsersPseudonym(pseudonym: Pseudonym): Promise<Course[]> {
		const courses: Course[] = await this.courseService.findAllByUserId(pseudonym.userId);

		return courses;
	}

	private async filterCoursesByToolAvailability(courses: Course[], externalToolId: string): Promise<Course[]> {
		const validCourses: Course[] = [];

		await Promise.all(
			courses.map(async (course: Course) => {
				const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
					new ContextRef({
						id: course.id,
						type: ToolContextType.COURSE,
					})
				);

				for await (const contextExternalTool of contextExternalTools) {
					const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
						contextExternalTool.schoolToolRef.schoolToolId
					);
					const externalTool: ExternalTool = await this.externalToolService.findExternalToolById(
						schoolExternalTool.toolId
					);
					const isRequiredTool: boolean = externalTool.id === externalToolId;

					if (isRequiredTool) {
						validCourses.push(course);
						break;
					}
				}
			})
		);

		return validCourses;
	}

	private async validateAndGetExternalTool(oauth2ClientId: string): Promise<ExternalTool> {
		const externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(
			oauth2ClientId
		);

		if (!externalTool || !externalTool.id) {
			throw new NotFoundLoggableException(ExternalTool.name, 'config.clientId', oauth2ClientId);
		}

		return externalTool;
	}

	private async validateSchoolExternalTool(schoolId: EntityId, toolId: string): Promise<void> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId,
			toolId,
		});

		if (schoolExternalTools.length === 0) {
			throw new NotFoundLoggableException(SchoolExternalTool.name, 'toolId', toolId);
		}
	}

	private async validateContextExternalTools(courseId: EntityId): Promise<void> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
			new ContextRef({ id: courseId, type: ToolContextType.COURSE })
		);

		if (contextExternalTools.length === 0) {
			throw new NotFoundLoggableException(ContextExternalTool.name, 'contextRef.id', courseId);
		}
	}

	private mapPseudonymToUserData(pseudonym: Pseudonym): UserData {
		const userData: UserData = {
			user_id: pseudonym.userId,
			username: this.pseudonymService.getIframeSubject(pseudonym.pseudonym),
		};

		return userData;
	}
}
