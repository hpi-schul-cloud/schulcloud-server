import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { GroupService } from '@modules/group';
import { RoleDto, RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { SCHOOL_REPO, SchoolRepo } from '@modules/school/domain/interface';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { CourseRepo } from '@shared/repo';
import { courseFactory, setupEntities, UserAndAccountTestFactory } from '@shared/testing';
import { Course as CourseDO, COURSE_REPO, CourseRepo as CourseDORepo } from '../domain';
import { CourseDoService, CourseService } from '../service';
import { CourseUc } from './course.uc';
import { CourseEntityMapper } from '../repo/mikro-orm/mapper/course.entity.mapper';
import { schoolFactory } from '../../school/testing';
import { courseFactory as courseDoFactory } from '../testing';

describe('CourseUc', () => {
	let module: TestingModule;
	let uc: CourseUc;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseDORepo: DeepMocked<CourseDORepo>;
	let schoolRepo: DeepMocked<SchoolRepo>;

	let courseService: DeepMocked<CourseService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let roleService: DeepMocked<RoleService>;
	let schoolService: DeepMocked<SchoolService>;
	let courseDoService: DeepMocked<CourseDoService>;
	let groupService: DeepMocked<GroupService>;
	let userService: DeepMocked<UserService>;
	let classService: DeepMocked<ClassService>;

	beforeAll(async () => {
		await setupEntities();
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
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: 'SCHOOL_REPO',
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
				{
					provide: COURSE_REPO,
					useValue: createMock<CourseDORepo>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
			],
		}).compile();

		uc = module.get(CourseUc);
		courseRepo = module.get(CourseRepo);
		courseService = module.get(CourseService);
		authorizationService = module.get(AuthorizationService);
		roleService = module.get(RoleService);
		schoolService = module.get(SchoolService);
		courseDoService = module.get(CourseDoService);
		groupService = module.get(GroupService);
		userService = module.get(UserService);
		classService = module.get(ClassService);
		courseDORepo = module.get(COURSE_REPO);
		schoolRepo = module.get(SCHOOL_REPO);
	});

	afterAll(async () => {
		await module.close();
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
});
