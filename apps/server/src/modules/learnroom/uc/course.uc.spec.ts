import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { RoleDto, RoleService } from '@modules/role';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseGroup, User } from '@shared/domain/entity';
import { Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { CourseRepo } from '@shared/repo/course';
import { setupEntities } from '@testing/database';
import { courseFactory } from '@testing/factory/course.factory';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { CourseService } from '../service';
import { CourseUc } from './course.uc';

describe('CourseUc', () => {
	let module: TestingModule;
	let uc: CourseUc;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseService: DeepMocked<CourseService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let roleService: DeepMocked<RoleService>;

	beforeAll(async () => {
		await setupEntities([User, Course, CourseGroup]);
		module = await Test.createTestingModule({
			providers: [
				CourseUc,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
			],
		}).compile();

		uc = module.get(CourseUc);
		courseRepo = module.get(CourseRepo);
		courseService = module.get(CourseService);
		authorizationService = module.get(AuthorizationService);
		roleService = module.get(RoleService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findAllByUser', () => {
		const setup = () => {
			const courses = courseFactory.buildList(5);
			const pagination = { skip: 1, limit: 2 };

			return { courses, pagination };
		};
		it('should return courses of user', async () => {
			const { courses } = setup();

			courseRepo.findAllByUserId.mockResolvedValueOnce([courses, 5]);
			const [array, count] = await uc.findAllByUser('someUserId');

			expect(count).toEqual(5);
			expect(array).toEqual(courses);
		});

		it('should pass on options correctly', async () => {
			const { pagination } = setup();

			const resultingOptions = { pagination, order: { updatedAt: SortOrder.desc } };
			await uc.findAllByUser('someUserId', pagination);
			expect(courseRepo.findAllByUserId).toHaveBeenCalledWith('someUserId', {}, resultingOptions);
		});
	});

	describe('getUserPermissionByCourseId', () => {
		const setup = () => {
			const { teacherUser } = UserAndAccountTestFactory.buildTeacher({}, []);
			const course = courseFactory.buildWithId({
				teachers: [teacherUser],
			});

			return { course, teacherUser };
		};
		it('should return permissions for user', async () => {
			const { course, teacherUser } = setup();
			courseService.findById.mockResolvedValue(course);
			authorizationService.getUserWithPermissions.mockResolvedValue(teacherUser);
			const mockRoleDto: RoleDto = {
				id: new ObjectId().toHexString(),
				name: RoleName.TEACHER,
				permissions: [Permission.COURSE_DELETE],
			};
			roleService.findByName.mockResolvedValue(mockRoleDto);
			const permissions = await uc.getUserPermissionByCourseId(teacherUser.id, course.id);

			expect(permissions.length).toBeGreaterThan(0);
			expect(courseService.findById).toHaveBeenCalledWith(course.id);
			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(teacherUser.id);
			expect(roleService.findByName).toHaveBeenCalledWith(RoleName.TEACHER);
		});
	});

	describe('findCourseById', () => {
		const setup = () => {
			const course = courseFactory.buildWithId();
			courseService.findById.mockResolvedValue(course);
			return { course };
		};

		it('should return course by id', async () => {
			const { course } = setup();
			const result = await uc.findCourseById(course.id);

			expect(result).toEqual(course);
			expect(courseService.findById).toHaveBeenCalledWith(course.id);
		});
	});

	describe('createCourse', () => {
		describe('when creating a course', () => {
			const setup = () => {
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher({}, []);
				const currentUser = currentUserFactory.build({ userId: teacherUser.id });
				const courseTitle = faker.lorem.words();

				return { currentUser, teacherUser, courseTitle };
			};

			it('should create a course', async () => {
				const { currentUser, courseTitle } = setup();

				await expect(uc.createCourse(currentUser, courseTitle)).resolves.not.toThrow();
				expect(courseService.create).toHaveBeenCalled();
			});
		});

		describe('when user does not have permission to create a course', () => {
			const setup = () => {
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher({}, []);
				const currentUser = currentUserFactory.build({ userId: teacherUser.id });
				const courseTitle = faker.lorem.words();

				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new Error('User does not have permission');
				});

				return { currentUser, teacherUser, courseTitle };
			};

			it('should throw an error', async () => {
				const { currentUser, courseTitle } = setup();

				await expect(uc.createCourse(currentUser, courseTitle)).rejects.toThrow();
				expect(courseService.create).not.toHaveBeenCalled();
			});
		});
	});
});
