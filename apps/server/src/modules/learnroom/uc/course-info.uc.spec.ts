import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { classFactory } from '@modules/class/domain/testing';
import { ClassesRepo } from '@modules/class/repo';
import { GroupService } from '@modules/group';
import { GroupRepo } from '@modules/group/repo/';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { groupFactory, setupEntities, UserAndAccountTestFactory, userDoFactory, userFactory } from '@shared/testing';
import { Course, CourseFilter, CourseSortProps, CourseStatus } from '../domain';
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
		describe('when courses are found', () => {
			const setup = () => {
				const user = userFactory.withRoleByName(RoleName.TEACHER).buildWithId();
				const teacher = userDoFactory.build({ id: user.id, firstName: 'firstName', lastName: 'lastName' });
				const { adminUser } = UserAndAccountTestFactory.buildAdmin({}, [Permission.COURSE_ADMINISTRATION]);
				const group = groupFactory.build({ name: 'groupName' });
				const clazz = classFactory.build({ name: 'A', gradeLevel: 1 });
				const courses = courseDoFactory.buildList(5, {
					syncedWithGroup: group.id,
					teacherIds: [user.id],
					groupIds: [group.id],
					classIds: [clazz.id],
				});
				const pagination = { skip: 1, limit: 2 };
				const courseStatus: CourseStatus = CourseStatus.CURRENT;
				const sortByField: CourseSortProps = CourseSortProps.NAME;
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
				courseDoService.getCourseInfo.mockResolvedValueOnce(new Page<Course>(courses, 5));

				return {
					user,
					courses,
					pagination,
					school,
					adminUser,
					group,
					courseStatus,
					sortByField,
					sortOrder,
					clazz,
				};
			};
			it('should return courses with sorted and filtered results', async () => {
				const { clazz, group, school, adminUser, sortByField, courseStatus, pagination, sortOrder, user } = setup();

				const result: Page<CourseInfoDto> = await uc.getCourseInfo(
					adminUser.id,
					school.id,
					sortByField,
					courseStatus,
					pagination,
					sortOrder
				);

				const filter: CourseFilter = { schoolId: school.id, status: courseStatus };
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

			it('should handle empty options gracefully', async () => {
				const { adminUser, school } = setup();
				const filter: CourseFilter = { schoolId: school.id, status: undefined };
				const options: IFindOptions<Course> = {
					order: {
						name: SortOrder.asc,
					},
					pagination: undefined,
				};

				await uc.getCourseInfo(adminUser.id, school.id, undefined, undefined, undefined, undefined);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(school.id);
				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(adminUser.id);
				expect(authorizationService.checkPermission).toHaveBeenCalled();
				expect(courseDoService.getCourseInfo).toHaveBeenCalledWith(filter, options);
			});
		});

		describe('when user does not have permission', () => {
			const setup = () => {
				const user = userFactory.withRoleByName(RoleName.TEACHER).buildWithId();
				const { adminUser } = UserAndAccountTestFactory.buildAdmin({}, []);

				const pagination = { skip: 1, limit: 2 };
				const courseStatus: CourseStatus = CourseStatus.CURRENT;
				const sortByField: CourseSortProps = CourseSortProps.NAME;
				const sortOrder: SortOrder = SortOrder.asc;
				const school = schoolFactory.build();

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(adminUser);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return {
					user,
					pagination,
					school,
					adminUser,
					courseStatus,
					sortByField,
					sortOrder,
				};
			};
			it('should throw an forbidden exception', async () => {
				const { school, adminUser, sortByField, courseStatus, pagination, sortOrder } = setup();

				const getCourseInfo = async () =>
					uc.getCourseInfo(adminUser.id, school.id, sortByField, courseStatus, pagination, sortOrder);

				expect(userService.findById).toHaveBeenCalledTimes(0);
				expect(classService.findById).toHaveBeenCalledTimes(0);
				expect(groupService.findById).toHaveBeenCalledTimes(0);
				await expect(getCourseInfo()).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when courses are not found', () => {
			const setup = () => {
				const adminUserId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();
				courseDoService.getCourseInfo.mockResolvedValueOnce(new Page<Course>([], 0));

				return {
					adminUserId,
					schoolId,
				};
			};

			it('should return an empty page if no courses are found', async () => {
				const { adminUserId, schoolId } = setup();

				const result = await uc.getCourseInfo(adminUserId, schoolId);

				expect(result.total).toBe(0);
				expect(result.data.length).toBe(0);
			});
		});
	});
});
