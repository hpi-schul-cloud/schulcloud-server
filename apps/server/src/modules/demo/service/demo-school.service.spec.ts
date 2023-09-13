import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { RoleService, UserService } from '@src/modules';
import { AccountService } from '@src/modules/account/services/account.service';
import { CourseService } from '@src/modules/learnroom/service';
import { LessonService } from '@src/modules/lesson/service';
import { FederalStateService, SchoolService } from '@src/modules/school';
import { CourseConfig, LessonConfig, UserConfig } from '../types';
import { DemoSchoolService } from './demo-school.service';

describe(DemoSchoolService.name, () => {
	let module: TestingModule;
	let service: DemoSchoolService;
	// let accountService: DeepMocked<AccountService>;
	let courseService: DeepMocked<CourseService>;
	// let federalStateService: DeepMocked<FederalStateService>;
	let lessonService: DeepMocked<LessonService>;
	let roleService: DeepMocked<RoleService>;
	// let schoolService: DeepMocked<SchoolService>;
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
		// schoolService = module.get(SchoolService);
		userService = module.get(UserService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupUserService = () => {
		const fakeSchoolId = 'aFakedSchoolId';

		const fakeUserId1 = 'aFakedUserId1';
		const userConfig1: UserConfig = {
			firstName: 'der',
			lastName: 'peter',
			email: 'der.peter@testen.de',
			roleNames: [RoleName.TEACHER],
		};
		userService.save.mockResolvedValueOnce({
			id: fakeUserId1,
			firstName: userConfig1.firstName,
			lastName: userConfig1.lastName,
			email: userConfig1.email,
			schoolId: fakeSchoolId,
			roles: [],
		});

		const fakeUserId2 = 'aFakedUserId2';
		const userConfig2: UserConfig = {
			firstName: 'der',
			lastName: 'peter',
			email: 'der.peter@testen.de',
			roleNames: [RoleName.TEACHER],
		};
		userService.save.mockResolvedValueOnce({
			id: fakeUserId2,
			firstName: userConfig2.firstName,
			lastName: userConfig2.lastName,
			email: userConfig2.email,
			schoolId: fakeSchoolId,
			roles: [],
		});

		roleService.findByNames.mockResolvedValue([{ id: 'the-teacher-roleid', name: RoleName.TEACHER }]);

		return { fakeSchoolId, fakeUserId1, fakeUserId2, userConfig1, userConfig2 };
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

	const setupCourseService = () => {
		const fakeSchoolId = 'aFakedSchoolId';

		const fakeCourseId1 = 'aFakedCourseId1';
		const courseConfig1: CourseConfig = {
			name: 'my first course',
			teachers: [],
			students: [],
			substitutionTeachers: [],
		};
		courseService.createCourse.mockResolvedValueOnce(fakeCourseId1);

		const fakeCourseId2 = 'aFakedCourseId2';
		const courseConfig2: CourseConfig = {
			name: 'my second course',
			teachers: [],
			students: [],
			substitutionTeachers: [],
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

	describe('createUser', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeUserId1, userConfig1 } = setupUserService();

			const creationProtocol = await service.createUser(fakeSchoolId, userConfig1);

			expect(creationProtocol).toEqual(
				expect.objectContaining({
					id: fakeUserId1,
					key: userConfig1.email,
				})
			);
		});
	});

	describe('createUsers', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeUserId1, fakeUserId2, userConfig1, userConfig2 } = setupUserService();

			const creationProtocol = await service.createUsers(fakeSchoolId, [userConfig1, userConfig2]);

			expect(creationProtocol.toString()).toBe(
				[
					{
						id: fakeUserId1,
						key: userConfig1.email,
						type: 'user',
					},
					{
						id: fakeUserId2,
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
	});

	describe('createSchool', () => {
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
});
