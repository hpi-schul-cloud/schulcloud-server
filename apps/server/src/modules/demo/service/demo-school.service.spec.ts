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

		const fakeFirstUserId = 'aFakedUserId1';
		const firstUserConfig: UserConfig = {
			firstName: 'der',
			lastName: 'peter',
			email: 'der.peter@testen.de',
			roleNames: [RoleName.TEACHER],
		};
		userService.save.mockResolvedValueOnce({
			id: fakeFirstUserId,
			firstName: firstUserConfig.firstName,
			lastName: firstUserConfig.lastName,
			email: firstUserConfig.email,
			schoolId: fakeSchoolId,
			roles: [],
		});

		const fakeSecondUserId = 'aFakedUserId2';
		const secondUserConfig: UserConfig = {
			firstName: 'der',
			lastName: 'peter',
			email: 'der.peter@testen.de',
			roleNames: [RoleName.TEACHER],
		};
		userService.save.mockResolvedValueOnce({
			id: fakeSecondUserId,
			firstName: secondUserConfig.firstName,
			lastName: secondUserConfig.lastName,
			email: secondUserConfig.email,
			schoolId: fakeSchoolId,
			roles: [],
		});

		roleService.findByNames.mockResolvedValue([{ id: 'the-teacher-roleid', name: RoleName.TEACHER }]);

		return { fakeSchoolId, fakeFirstUserId, fakeSecondUserId, firstUserConfig, secondUserConfig };
	};

	const setupLessonService = () => {
		const fakeSchoolId = 'aFakedSchoolId';

		const fakeFirstLessonId = 'aFakedLessonId1';
		const firstLessonConfig: LessonConfig = {
			name: 'my first lesson',
		};
		lessonService.createLesson.mockResolvedValueOnce(fakeFirstLessonId);

		const fakeSecondLessonId = 'aFakedLessonId2';
		const secondLessonConfig: LessonConfig = {
			name: 'my second lesson',
		};
		lessonService.createLesson.mockResolvedValueOnce(fakeSecondLessonId);

		return {
			fakeSchoolId,
			fakeFirstLessonId,
			fakeSecondLessonId,
			firstLessonConfig,
			secondLessonConfig,
		};
	};

	const setupCourseService = () => {
		const fakeSchoolId = 'aFakedSchoolId';

		const fakeFirstCourseId = 'aFakedCourseId1';
		const firstCourseConfig: CourseConfig = {
			name: 'my first course',
			teachers: [],
			students: [],
			substitutionTeachers: [],
		};
		courseService.createCourse.mockResolvedValueOnce(fakeFirstCourseId);

		const fakeSecondCourseId = 'aFakedCourseId2';
		const secondCourseConfig: CourseConfig = {
			name: 'my second course',
			teachers: [],
			students: [],
			substitutionTeachers: [],
		};
		courseService.createCourse.mockResolvedValueOnce(fakeSecondCourseId);

		return {
			fakeSchoolId,
			fakeFirstCourseId,
			fakeSecondCourseId,
			firstCourseConfig,
			secondCourseConfig,
		};
	};

	describe('createUser', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeFirstUserId, firstUserConfig } = setupUserService();

			const creationProtocol = await service.createUser(fakeSchoolId, firstUserConfig);

			expect(creationProtocol).toEqual(
				expect.objectContaining({
					id: fakeFirstUserId,
					key: firstUserConfig.email,
				})
			);
		});
	});

	describe('createUsers', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeFirstUserId, fakeSecondUserId, firstUserConfig, secondUserConfig } = setupUserService();

			const creationProtocol = await service.createUsers(fakeSchoolId, [firstUserConfig, secondUserConfig]);

			expect(creationProtocol.toString()).toBe(
				[
					{
						id: fakeFirstUserId,
						key: firstUserConfig.email,
						type: 'user',
					},
					{
						id: fakeSecondUserId,
						key: secondUserConfig.email,
						type: 'user',
					},
				].toString()
			);
		});
	});

	describe('createLesson', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeFirstLessonId, firstLessonConfig } = setupLessonService();

			const creationProtocol = await service.createLesson(fakeSchoolId, firstLessonConfig);

			expect(creationProtocol).toEqual(
				expect.objectContaining({
					id: fakeFirstLessonId,
					key: firstLessonConfig.name,
				})
			);
		});
	});

	describe('createLessons', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeFirstLessonId, fakeSecondLessonId, firstLessonConfig, secondLessonConfig } =
				setupLessonService();

			const userCreationProtocol = await service.createLessons(fakeSchoolId, [firstLessonConfig, secondLessonConfig]);

			expect(userCreationProtocol.toString()).toBe(
				[
					{
						id: fakeFirstLessonId,
						key: firstLessonConfig.name,
						type: 'user',
					},
					{
						id: fakeSecondLessonId,
						key: secondLessonConfig.name,
						type: 'user',
					},
				].toString()
			);
		});
	});

	describe('createCourse', () => {
		it('should return correct creationProtocol', async () => {
			const { fakeSchoolId, fakeFirstCourseId, firstCourseConfig } = setupCourseService();

			const creationProtocol = await service.createCourse(fakeSchoolId, firstCourseConfig, {
				id: 'an-id',
				type: 'none',
			});

			expect(creationProtocol).toEqual(
				expect.objectContaining({
					id: fakeFirstCourseId,
					key: firstCourseConfig.name,
				})
			);
		});
	});
});
