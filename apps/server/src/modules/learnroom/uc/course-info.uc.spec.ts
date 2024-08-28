import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { classFactory } from '@modules/class/domain/testing';
import { ClassesRepo } from '@modules/class/repo';
import { GroupService } from '@modules/group';
import { GroupRepo } from '@modules/group/repo/';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { groupFactory, setupEntities, UserAndAccountTestFactory, userDoFactory, userFactory } from '@shared/testing';
import { Course, COURSE_REPO, CourseRepo as CourseDORepo, CourseSortQueryType, CourseStatusQueryType } from '../domain';
import { CourseDoService } from '../service';
import { courseFactory as courseDoFactory } from '../testing';
import { CourseInfoUc } from './course-info.uc';
import { CourseInfoDto } from './dto';

describe('CourseInfoUc', () => {
	let module: TestingModule;
	let uc: CourseInfoUc;
	let groupRepo: DeepMocked<GroupRepo>;
	let classesRepo: DeepMocked<ClassesRepo>;

	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;
	let courseDoService: DeepMocked<CourseDoService>;
	let groupService: DeepMocked<GroupService>;
	let userService: DeepMocked<UserService>;
	let classService: DeepMocked<ClassService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseInfoUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
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

		uc = module.get(CourseInfoUc);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
		courseDoService = module.get(CourseDoService);
		groupService = module.get(GroupService);
		userService = module.get(UserService);
		classService = module.get(ClassService);
		groupRepo = module.get(GroupRepo);
		classesRepo = module.get(ClassesRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getCourseInfo', () => {
		const setup = () => {
			const user = userFactory.withRoleByName(RoleName.TEACHER).buildWithId();
			const teacher = userDoFactory.build({ id: user.id, firstName: 'firstName', lastName: 'lastName' });
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
			groupRepo.findGroupById.mockResolvedValue(group);
			groupService.findById.mockResolvedValue(group);
			userService.findById.mockResolvedValue(teacher);
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

		it('should return courses with sorted and filtered results', async () => {
			const {
				courses,
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
			courseDoService.getCourseInfo.mockResolvedValueOnce(new Page<Course>(courses, 5));

			const result: Page<CourseInfoDto> = await uc.getCourseInfo(
				adminUser.id,
				school.id,
				sortByField,
				statusTypeQuery,
				pagination,
				sortOrder
			);

			const filter = { schoolId: school.id, courseStatusQueryType: statusTypeQuery };
			const options = {
				pagination,
				order: {
					[sortByField]: sortOrder,
				},
			};

			expect(schoolService.getSchoolById).toHaveBeenCalledWith(school.id);
			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(adminUser.id);
			expect(authorizationService.checkPermission).toHaveBeenCalled();
			expect(courseDoService.getCourseInfo).toHaveBeenCalledWith(filter, options);
			expect(userService.findById).toHaveBeenCalledWith(user.id);
			expect(classService.findById).toHaveBeenCalledWith(clazz.id);
			expect(groupService.findById).toHaveBeenCalledWith(group.id);
			expect(result.total).toBe(5);
			expect(result.data.length).toBe(5);
			expect(result.data[0].classes).toStrictEqual(['1A', 'groupName']);
			expect(result.data[0].teachers).toStrictEqual(['firstName lastName']);
		});

		it('should return an empty page if no courses are found', async () => {
			const { adminUser, school, courseStatusQueryType: statusTypeQuery, sortByField, pagination, sortOrder } = setup();

			courseDoService.getCourseInfo.mockResolvedValueOnce(new Page<Course>([], 0));

			const result = await uc.getCourseInfo(
				adminUser.id,
				school.id,
				sortByField,
				statusTypeQuery,
				pagination,
				sortOrder
			);

			expect(result.total).toBe(0);
			expect(result.data.length).toBe(0);
		});

		it('should handle empty data inputs', async () => {
			const { adminUser, school } = setup();

			courseDoService.getCourseInfo.mockResolvedValueOnce(new Page<Course>([], 0));

			const result = await uc.getCourseInfo(adminUser.id, school.id, undefined, undefined, undefined, undefined);

			expect(schoolService.getSchoolById).toHaveBeenCalledWith(school.id);
			expect(result.total).toBe(0);
			expect(result.data.length).toBe(0);
		});
	});
});
