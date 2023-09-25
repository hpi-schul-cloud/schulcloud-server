import { Injectable } from '@nestjs/common';
import { EntityId, LegacySchoolDo, RoleReference, UserDO } from '@shared/domain';
import { CourseCreateDto, FederalStateService, LegacySchoolService, RoleService, UserService } from '@src/modules';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { CourseService } from '@src/modules/learnroom/service';
import { LessonService } from '@src/modules/lesson/service';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import crypto from 'crypto';
import demoschoolConfig from '../configurations/default-demoschool';
import { CreationProtocol } from '../types';
import { CourseConfig, LessonConfig, SchoolConfig, UserConfig } from '../types/demo-configuration.types';

const getUserIdByEmail = (email: string, userDos: CreationProtocol[] = []) => {
	const user = userDos.find((u) => {
		const emailWithoutPostfix = u.key?.replace(/_[^_]*?@/, '@');
		console.log(`${emailWithoutPostfix ?? ''} === ${email}`);
		return emailWithoutPostfix === email;
	});
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
		private readonly schoolService: LegacySchoolService,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly roleService: RoleService,
		private readonly courseService: CourseService,
		private readonly federalStateService: FederalStateService,
		private readonly lessonService: LessonService // private readonly teamservice: TeamService
	) {}

	async createDemoSchool(): Promise<CreationProtocol> {
		const schoolCreationProtocol = await this.createSchool(demoschoolConfig.school);

		return schoolCreationProtocol;
	}

	async createSchool(config: SchoolConfig): Promise<CreationProtocol> {
		const { name, federalStateName } = config;
		const federalState = await this.federalStateService.findFederalStateByName(federalStateName);
		const schoolDo = new LegacySchoolDo({
			name,
			federalState,
			features: [],
		});
		const password = `pswd_${crypto.randomUUID()}`;
		const passwordEntry: CreationProtocol = { key: password, type: 'password', id: '', children: [] };
		const postfix = `_${crypto.randomUUID()}`;
		const postfixEntry: CreationProtocol = { key: postfix, type: 'postfix', id: '', children: [] };
		const createdSchoolDo = await this.schoolService.save(schoolDo);
		const protocol: CreationProtocol = {
			key: name,
			type: 'school',
			id: createdSchoolDo.id,
			children: [passwordEntry, postfixEntry],
		};

		if (config.users) {
			const users = await this.createUsers(createdSchoolDo.id as string, config.users, postfix, password);
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

		const teacherIds = mapUserEmailsToIds(teachers, users);
		const studentIds = mapUserEmailsToIds(students, users);
		const substitutionTeacherIds = mapUserEmailsToIds(substitutionTeachers, users);

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

	async createUsers(
		schoolId: string,
		config: UserConfig[],
		postfix: string,
		password: string
	): Promise<CreationProtocol[]> {
		const promises: Promise<CreationProtocol>[] = [];
		for (const user of config) {
			promises.push(this.createUser(schoolId, user, postfix, password));
		}
		const users = Promise.all(promises);
		return users;
	}

	async createUser(schoolId: string, config: UserConfig, postfix: string, password: string): Promise<CreationProtocol> {
		const { firstName, lastName, email, roleNames } = config;
		const roles: RoleDto[] = await this.roleService.findByNames(roleNames);
		const roleRefs = roles.map(
			(role: RoleDto): RoleReference => new RoleReference({ id: role.id || '', name: role.name })
		);
		const extendedEmail = email?.replace('@', `${postfix}@`);

		const user = new UserDO({
			firstName: firstName ?? '',
			lastName: lastName ?? '',
			email: extendedEmail ?? '',
			roles: roleRefs,
			schoolId,
			forcePasswordChange: false,
		});

		const userDo = await this.userService.save(user);
		await this.createAccount(userDo, password);

		return { id: userDo.id, type: 'user', key: extendedEmail };
	}

	private async createAccount(user: UserDO, password: string): Promise<AccountSaveDto> {
		const accountSaveDto: AccountSaveDto = {
			username: user.email,
			password,
			userId: user.id,
		};

		return this.accountService.save(accountSaveDto);
	}
}
