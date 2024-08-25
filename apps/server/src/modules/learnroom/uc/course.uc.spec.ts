import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { classFactory } from '@modules/class/domain/testing';
import { ClassesRepo } from '@modules/class/repo';
import { GroupService } from '@modules/group';
import { GroupRepo } from '@modules/group/repo/';
import { RoleDto, RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { Page, UserDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { CourseRepo } from '@shared/repo';
import {
	courseFactory,
	groupFactory,
	setupEntities,
	UserAndAccountTestFactory,
	userDoFactory,
	userFactory,
} from '@shared/testing';
import { COURSE_REPO, CourseRepo as CourseDORepo, CourseSortQueryType, CourseStatusQueryType } from '../domain';
import { CourseDoService, CourseService } from '../service';
import { courseFactory as courseDoFactory } from '../testing';
import { CourseUc } from './course.uc';
import { CourseInfoDto } from './dto';

describe('CourseUc', () => {
	let module: TestingModule;
	let uc: CourseUc;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseDORepo: DeepMocked<CourseDORepo>;
	let groupRepo: DeepMocked<GroupRepo>;
	let classesRepo: DeepMocked<ClassesRepo>;

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
					provide: GroupRepo,
					useValue: createMock<GroupRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
				{
					provide: ClassesRepo,
					useValue: createMock<ClassesRepo>(),
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
		groupRepo = module.get(GroupRepo);
		classesRepo = module.get(ClassesRepo);
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

	describe('findAllCourses', () => {
		const setup = () => {
			const user: User = userFactory.withRoleByName(RoleName.TEACHER).buildWithId();
			const teacher: UserDO = userDoFactory.build({ id: user.id, firstName: 'firstName', lastName: 'lastName' });
			const { adminUser } = UserAndAccountTestFactory.buildAdmin({}, [
				Permission.COURSE_ADMINISTRATION,
				Permission.ADMIN_VIEW,
			]);
			const group = groupFactory.build({ name: 'groupName' });
			const clazz = classFactory.build({ name: 'A', gradeLevel: 1 });

			const courses = courseDoFactory.buildList(5, {
				syncedWithGroup: group.id,
				teacherIds: [user.id],
				groupIds: [group.id],
				classIds: [clazz.id],
			});
			const pagination = { skip: 1, limit: 2 };
			const courseStatusQueryType: CourseStatusQueryType = CourseStatusQueryType.CURRENT;
			const sortByField: CourseSortQueryType = CourseSortQueryType.NAME;
			const sortOrder: SortOrder = SortOrder.asc;

			const school = schoolFactory.build();
			schoolService.getSchoolById.mockResolvedValueOnce(school);
			authorizationService.getUserWithPermissions.mockResolvedValue(adminUser);
			authorizationService.checkPermission.mockReturnValueOnce(undefined);
			courseDORepo.findCourses.mockResolvedValueOnce(courses);
			courseDoService.findCourses.mockResolvedValueOnce(courses);
			groupRepo.findGroupById.mockResolvedValue(group);
			groupService.findById.mockResolvedValue(group);
			userService.findById.mockResolvedValue(teacher);
			groupService.findById.mockResolvedValue(group);
			classService.findById.mockResolvedValue(clazz);
			classesRepo.findClassById.mockResolvedValue(clazz);

			return {
				user,
				courses,
				pagination,
				school,
				adminUser,
				group,
				courseStatusQueryType,
				sortByField,
				sortOrder,
				clazz,
			};
		};
		it('should return courses of user', async () => {
			const {
				clazz,
				group,
				school,
				adminUser,
				sortByField,
				courseStatusQueryType: statusTypeQuery,
				pagination,
				sortOrder,
				user,
			} = setup();

			const result: Page<CourseInfoDto> = await uc.findAllCourses(
				adminUser.id,
				school.id,
				sortByField,
				statusTypeQuery,
				pagination,
				sortOrder
			);

			expect(schoolService.getSchoolById).toHaveBeenCalledWith(school.id);
			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(adminUser.id);
			expect(authorizationService.checkPermission).toHaveBeenCalled();
			const filter = { schoolId: school.id, courseStatusQueryType: statusTypeQuery };
			const options = {
				pagination,
				order: {
					[sortByField]: sortOrder,
				},
			};
			expect(courseDoService.findCourses).toHaveBeenCalledWith(filter, options);
			expect(userService.findById).toHaveBeenCalledWith(user.id);
			expect(classService.findById).toHaveBeenCalledWith(clazz.id);
			expect(groupService.findById).toHaveBeenCalledWith(group.id);
			expect(result.total).toBe(5);
			expect(result.data.length).toBe(5);
			expect(result.data[0].classes).toStrictEqual(['1A', 'groupName']);
			expect(result.data[0].teachers).toStrictEqual(['firstName lastName']);
		});
	});
});
