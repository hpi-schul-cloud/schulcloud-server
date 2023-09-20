import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName, SchoolDO, UserDO } from '@shared/domain';
import { RoleService, UserService } from '@src/modules';
import { AccountService } from '@src/modules/account/services/account.service';
import { CourseService } from '@src/modules/learnroom/service';
import { LessonService } from '@src/modules/lesson/service';
import { FederalStateService, SchoolService } from '@src/modules/school';
import { FederalStateNames } from '@src/modules/school/types';
import { CourseConfig, LessonConfig, SchoolConfig, UserConfig } from '../types';
import { DemoSchoolService } from './demo-school.service';

describe(DemoSchoolService.name, () => {
	let module: TestingModule;
	let service: DemoSchoolService;
	// let accountService: DeepMocked<AccountService>;
	let courseService: DeepMocked<CourseService>;
	// let federalStateService: DeepMocked<FederalStateService>;
	let lessonService: DeepMocked<LessonService>;
	let roleService: DeepMocked<RoleService>;
	let schoolService: DeepMocked<SchoolService>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DemoSchoolService,
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: FederalStateService,
					useValue: createMock<FederalStateService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		service = module.get(DemoSchoolService);
		courseService = module.get(CourseService);
		// accountService = module.get(AccountService);
		// federalStateService = module.get(FederalStateService);
		lessonService = module.get(LessonService);
		roleService = module.get(RoleService);
		schoolService = module.get(SchoolService);
		userService = module.get(UserService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const createUserConfig = (firstName: string, lastName: string, roleNames: RoleName[]) => {
		const userId = `id_${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
		const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@testing.de`;
		const userConfig: UserConfig = {
			firstName,
			lastName,
			email,
			roleNames,
		};
		return { userId, userConfig };
	};

	const setupUserService = (fakeSchoolId = 'aFakedSchoolId') => {
		userService.save.mockImplementation(async (user: UserDO): Promise<UserDO> => {
			const userId = `id_${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}`;
			return Promise.resolve({
				id: userId,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				schoolId: fakeSchoolId,
				roles: [],
			} as UserDO);
		});

		roleService.findByNames.mockResolvedValue([{ id: 'the-teacher-roleid', name: RoleName.TEACHER }]);

		return { fakeSchoolId };
	};

	const setupLessonService = () => {
		const fakeSchoolId = 'aFakedSchoolId';

		const fakeLessonId1 = 'aFakedLessonId1';
		const lessonConfig1: LessonConfig = {
			name: 'my first lesson',
		};
		lessonService.createLesson.mockResolvedValueOnce(fakeLessonId1);

		const fakeLessonId2 = 'aFakedLessonId2';
		const lessonConfig2: LessonConfig = {
			name: 'my second lesson',
		};
		lessonService.createLesson.mockResolvedValueOnce(fakeLessonId2);

		return {
			fakeSchoolId,
			fakeLessonId1,
			fakeLessonId2,
			lessonConfig1,
			lessonConfig2,
		};
	};

	const setupCourseService = (fakeSchoolId = 'aFakedSchoolId', teacherEmailsCourse1: string[] = []) => {
		const fakeCourseId1 = 'aFakedCourseId1';
		const courseConfig1: CourseConfig = {
			name: 'my first course',
			teachers: teacherEmailsCourse1,
			students: [],
			substitutionTeachers: [],
		};
		courseService.createCourse.mockResolvedValueOnce(fakeCourseId1);

		const fakeCourseId2 = 'aFakedCourseId2';
		const courseConfig2: CourseConfig = {
			name: 'my second course',
			teachers: ['not.existing.teacher@testen.de'],
			students: ['not.existing.student@testen.de'],
			substitutionTeachers: ['not.existing.substitution.teacher@testen.de'],
		};
		courseService.createCourse.mockResolvedValueOnce(fakeCourseId2);

		const fakeProtocol = {
			id: 'an-id',
			type: 'none',
		};

		return {
			fakeSchoolId,
			fakeCourseId1,
			fakeCourseId2,
			courseConfig1,
			courseConfig2,
			fakeProtocol,
		};
	};

	const setupSchoolService = () => {
		const fakeSchoolId = 'aFakedSchoolId';
		setupUserService(fakeSchoolId);
		const { userId, userConfig } = createUserConfig('Karl', 'Lähranda', [RoleName.TEACHER]);
		const teacherEmails = [userConfig.email];
		const { courseConfig1, courseConfig2 } = setupCourseService(fakeSchoolId, teacherEmails);

		const schoolConfig: SchoolConfig = {
			name: 'my first school',
			federalStateName: FederalStateNames.NIEDERSACHSEN,
			courses: [courseConfig1, courseConfig2],
			users: [userConfig],
		};
		schoolService.save.mockResolvedValueOnce({ id: fakeSchoolId } as SchoolDO);

		return {
			fakeSchoolId,
			schoolConfig,
			userId,
			userConfig,
			courseConfig1,
		};
	};

	describe('createUser', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId } = setupUserService();
			const { userId, userConfig } = createUserConfig('edith', 'laputschek', [RoleName.TEACHER]);

			const creationProtocol = await service.createUser(fakeSchoolId, userConfig, 'fakePassword');

			expect(creationProtocol).toEqual(
				expect.objectContaining({
					id: userId,
					key: userConfig.email,
				})
			);
		});
	});

	describe('createUsers', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId } = setupUserService();
			const { userId: userId1, userConfig: userConfig1 } = createUserConfig('edith', 'laputschek', [RoleName.TEACHER]);
			const { userId: userId2, userConfig: userConfig2 } = createUserConfig('pjotr', 'kawalschek', [RoleName.TEACHER]);

			const creationProtocol = await service.createUsers(fakeSchoolId, [userConfig1, userConfig2], 'fakePassword');

			expect(creationProtocol.toString()).toBe(
				[
					{
						id: userId1,
						key: userConfig1.email,
						type: 'user',
					},
					{
						id: userId2,
						key: userConfig2.email,
						type: 'user',
					},
				].toString()
			);
		});
	});

	describe('createLesson', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeLessonId1, lessonConfig1 } = setupLessonService();

			const creationProtocol = await service.createLesson(fakeSchoolId, lessonConfig1);

			expect(creationProtocol).toEqual(
				expect.objectContaining({
					id: fakeLessonId1,
					key: lessonConfig1.name,
				})
			);
		});
	});

	describe('createLessons', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeLessonId1, fakeLessonId2, lessonConfig1, lessonConfig2 } = setupLessonService();

			const userCreationProtocol = await service.createLessons(fakeSchoolId, [lessonConfig1, lessonConfig2]);

			expect(userCreationProtocol.toString()).toBe(
				[
					{
						id: fakeLessonId1,
						key: lessonConfig1.name,
						type: 'user',
					},
					{
						id: fakeLessonId2,
						key: lessonConfig2.name,
						type: 'user',
					},
				].toString()
			);
		});
	});

	describe('createCourse', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeCourseId1, courseConfig1, fakeProtocol } = setupCourseService();

			const creationProtocol = await service.createCourse(fakeSchoolId, courseConfig1, fakeProtocol);

			expect(creationProtocol).toEqual(
				expect.objectContaining({
					id: fakeCourseId1,
					key: courseConfig1.name,
				})
			);
		});
	});

	describe('createCourses', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeCourseId1, fakeCourseId2, courseConfig1, courseConfig2, fakeProtocol } =
				setupCourseService();

			const userCreationProtocol = await service.createCourses(
				fakeSchoolId,
				[courseConfig1, courseConfig2],
				fakeProtocol
			);

			expect(userCreationProtocol.toString()).toBe(
				[
					{
						id: fakeCourseId1,
						key: courseConfig1.name,
						type: 'course',
					},
					{
						id: fakeCourseId2,
						key: courseConfig2.name,
						type: 'course',
					},
				].toString()
			);
		});

		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeCourseId1, fakeCourseId2, courseConfig1, courseConfig2, fakeProtocol } =
				setupCourseService();

			const userCreationProtocol = await service.createCourses(
				fakeSchoolId,
				[courseConfig1, courseConfig2],
				fakeProtocol
			);

			expect(userCreationProtocol.toString()).toBe(
				[
					{
						id: fakeCourseId1,
						key: courseConfig1.name,
						type: 'course',
					},
					{
						id: fakeCourseId2,
						key: courseConfig2.name,
						type: 'course',
					},
				].toString()
			);
		});
	});

	describe('createSchool', () => {
		describe('when teacher exists', () => {
			it('should find the user and return correct creationProtocol', async () => {
				const { fakeSchoolId, schoolConfig } = setupSchoolService();

				const creationProtocol = await service.createSchool(schoolConfig);

				expect(creationProtocol).toEqual(
					expect.objectContaining({
						id: fakeSchoolId,
						key: schoolConfig.name,
						type: 'school',
					})
				);
			});
		});
	});

	describe('createDemoSchool', () => {
		it('should use default configuration for creating a demo school', async () => {
			setupSchoolService();

			const creationProtocol = await service.createDemoSchool();

			expect(creationProtocol).toBeDefined();
		});
	});
});
