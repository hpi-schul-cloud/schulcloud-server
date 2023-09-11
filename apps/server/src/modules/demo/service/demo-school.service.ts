import { Injectable } from '@nestjs/common';
import { EntityId, RoleName, RoleReference, SchoolDO, UserDO } from '@shared/domain';
import { CourseCreateDto, RoleService, UserService } from '@src/modules';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { CourseService } from '@src/modules/learnroom/service';
import { LessonService } from '@src/modules/lesson/service';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { FederalStateService, SchoolService } from '@src/modules/school';
import demoschoolConfig from '../configurations/default-demoschool';
import { CreationProtocol } from '../types';
import { CourseConfig, LessonConfig, SchoolConfig, UserConfig } from '../types/demo-configuration.types';

const getUserIdByEmail = (email: string, userDos: CreationProtocol[] = []) => {
	const user = userDos.find((u) => u.key === email);
	if (user) {
		return user.id;
	}

	return undefined;
};

const mapUserEmailsToIds = (emails: string[] = [], users: CreationProtocol[] = []) => {
	const ids = emails.map((email) => getUserIdByEmail(email, users)).filter((defined) => defined) as string[];
	return ids;
};

@Injectable()
export class DemoSchoolService {
	constructor(
		// private readonly repo: DemoSchoolRepo,
		private readonly schoolService: SchoolService,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly roleService: RoleService,
		private readonly courseService: CourseService,
		private readonly federalStateService: FederalStateService,
		private readonly lessonService: LessonService // private readonly teamservice: TeamService
	) {}

	async createDemoSchool(): Promise<CreationProtocol[]> {
		const promises: Promise<CreationProtocol>[] = [];
		for (const school of demoschoolConfig.schools) {
			promises.push(this.createSchool(school));
		}
		const schools = await Promise.all(promises);

		return schools;
	}

	async getRoleReference(roleNames: RoleName[]): Promise<RoleReference[]> {
		const roles = await this.roleService.findByNames(roleNames);
		return roles.map((role) => {
			return { id: role.id as string, name: role.name };
		});
	}

	async createSchool(config: SchoolConfig): Promise<CreationProtocol> {
		const { name, federalStateName } = config;
		const federalState = await this.federalStateService.findFederalStateByName(federalStateName);
		const schoolDo = new SchoolDO({
			name,
			federalState,
			features: [],
		});
		const createdSchoolDo = await this.schoolService.save(schoolDo);
		const protocol: CreationProtocol = { key: name, type: 'school', id: createdSchoolDo.id, children: [] };

		if (config.users) {
			const users = await this.createUsers(createdSchoolDo.id as string, config.users);
			protocol.children = [...(protocol.children ?? []), ...users];
		}

		if (config.courses) {
			const courses = await this.createCourses(createdSchoolDo.id as string, config.courses, protocol);
			protocol.children = [...(protocol.children ?? []), ...courses];
		}

		return protocol;
	}

	async createCourses(schoolId: EntityId, configs: CourseConfig[], protocol: CreationProtocol) {
		const promises: Promise<CreationProtocol>[] = [];
		for (const config of configs) {
			promises.push(this.createCourse(schoolId, config, protocol));
		}
		const courses = await Promise.all(promises);
		return courses;
	}

	async createCourse(schoolId: EntityId, config: CourseConfig, protocol: CreationProtocol): Promise<CreationProtocol> {
		const { name, teachers, students, substitutionTeachers } = config;
		const users = protocol.children?.filter((c) => c.type === 'user') as CreationProtocol[];

		// problem: where to store the userDOs? if we only protocol name and user
		// solution: store email as the name in the protocol

		const teacherIds = mapUserEmailsToIds(teachers, users);
		console.log('teacherIds', teacherIds);
		const studentIds = mapUserEmailsToIds(students, users);
		console.log('studentIds', studentIds);
		const substitutionTeacherIds = mapUserEmailsToIds(substitutionTeachers, users);
		console.log('substitutionTeacherIds', substitutionTeacherIds);

		const courseDto: CourseCreateDto = {
			name,
			schoolId,
			teacherIds,
			substitutionTeacherIds,
			studentIds,
		};

		const courseId = await this.courseService.createCourse(courseDto);
		let lessons: CreationProtocol[] = [];
		if (config.lessons) {
			lessons = await this.createLessons(courseId, config.lessons);
		}
		// if (config.teams) {
		// 	protocol.teams = await this.createTeams(schoolId, config.teams, protocol);
		// }
		return { id: courseId, key: name, type: 'course', children: lessons };
	}

	async createLessons(courseId: string, configs: LessonConfig[]): Promise<CreationProtocol[]> {
		const promises: Promise<CreationProtocol>[] = [];
		for (const config of configs) {
			promises.push(this.createLesson(courseId, config));
		}
		const lessons = await Promise.all(promises);
		return lessons;
	}

	async createLesson(courseId: string, config: LessonConfig): Promise<CreationProtocol> {
		const { name, contents, hidden } = config;
		const id = await this.lessonService.createLesson({ name, contents, hidden, courseId });
		return { id, key: name, type: 'lesson' };
	}

	// async createTeams(
	// 	schoolId: string,
	// 	configs: TeamConfig[],
	// 	protocol: CreationProtocol
	// ): Promise<{ id: string; name: string }[]> {
	// 	const promises: Promise<{ id: string; name: string }>[] = [];
	// 	for (const config of configs) {
	// 		promises.push(this.createTeam(schoolId, config, protocol));
	// 	}
	// 	const lessons = await Promise.all(promises);
	// 	return lessons;
	// }

	// async createTeam(schoolId: string, config: TeamConfig, protocol: CreationProtocol): Promise<{ id: string; name: string }> {
	// 	const { name, teamUsers } = config;
	// 	const userDos = protocol.users as UserDO[];

	// 	const roleNames = [
	// 		RoleName.TEAMMEMBER,
	// 		RoleName.TEAMEXPERT,
	// 		RoleName.TEAMLEADER,
	// 		RoleName.TEAMADMINISTRATOR,
	// 		RoleName.TEAMOWNER,
	// 	];
	// 	const roles: RoleDto[] = await this.roleService.findByNames(roleNames);
	// 	const roleRefMap = roles.reduce((refMap: Record<string, string>, role: RoleDto): Record<string, string> => {
	// 		if (role.id) {
	// 			refMap[role.name] = role.id;
	// 		}
	// 		return refMap;
	// 	}, {});

	// 	const teamUsersWithUserIds = teamUsers.flatMap((user) => {
	// 		const { userEmail, roleName } = user;
	// 		const userIds = user.userEmail ? mapUserEmailsToIds([userEmail], userDos) : undefined;
	// 		if (userIds === undefined || userIds.length !== 1) {
	// 			throw new Error(`unknown user-email "{$user.userEmail}`);
	// 		}
	// 		const userId = userIds[0];
	// 		const roleId = roleRefMap[roleName];
	// 		return { roleId, userId, schoolId };
	// 	});
	// 	const id = await this.teamservice.createTeam({ name, teamUsers: teamUsersWithUserIds, filePermission });
	// 	return { id, name };
	// }

	async createUsers(schoolId: string, config: UserConfig[]): Promise<CreationProtocol[]> {
		const promises: Promise<CreationProtocol>[] = [];
		for (const user of config) {
			promises.push(this.createUser(schoolId, user));
		}
		const users = Promise.all(promises);
		return users;
	}

	async createUser(schoolId: string, config: UserConfig): Promise<CreationProtocol> {
		const { firstName, lastName, email, roleNames } = config;
		const roles: RoleDto[] = await this.roleService.findByNames(roleNames);
		const roleRefs = roles.map(
			(role: RoleDto): RoleReference => new RoleReference({ id: role.id || '', name: role.name })
		);

		const user = new UserDO({
			firstName: firstName ?? '',
			lastName: lastName ?? '',
			email: email ?? '',
			roles: roleRefs,
			schoolId,
			forcePasswordChange: false,
			// consent: {
			// 	userConsent: {
			// 	  form: "digital",
			// 	  privacyConsent: true,
			// 	termsOfUseConsent: true,
			// 	  dateOfPrivacyConsent: {
			// 		"$date": "2023-08-31T11:58:32.356Z"
			// 	  },
			// 	  dateOfTermsOfUseConsent: {
			// 		"$date": "2023-08-31T11:58:32.356Z"
			// 	  }
			// 	}
			//   },
			//   birthday: {
			// 	"$date": "2007-08-09T00:00:00.000Z"
			//   },
		});

		const userDo = await this.userService.save(user);
		await this.createAccount(userDo);
		return { id: userDo.id, type: 'user', key: email };
	}

	async createAccount(user: UserDO): Promise<AccountSaveDto> {
		const accountSaveDto: AccountSaveDto = {
			username: user.email,
			password: 'aDemo!School+3342',
			userId: user.id,
		};

		return this.accountService.save(accountSaveDto);
	}
}
