import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { classFactory } from '@modules/class/domain/testing';
import { GroupService } from '@modules/group';
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
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
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
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getCourseInfo', () => {
		describe('when calling getCourseInfo', () => {
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
				const pagination = { skip: 0, limit: 5 };
				const school = schoolFactory.build();

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(adminUser);
				authorizationService.checkPermission.mockReturnValueOnce(undefined);
				groupService.findById.mockResolvedValue(group);
				userService.findById.mockResolvedValue(teacher);
				classService.findById.mockResolvedValue(clazz);
				courseDoService.getCourseInfo.mockResolvedValueOnce(new Page<Course>(courses, 5));

				return {
					user,
					courses,
					pagination,
					school,
					adminUser,
					group,
					clazz,
				};
			};

			it('should call school service getSchoolById', async () => {
				const { adminUser, school } = setup();

				await uc.getCourseInfo(adminUser.id, school.id);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(school.id);
			});

			it('should call user service getUserWithPermissions', async () => {
				const { adminUser, school } = setup();

				await uc.getCourseInfo(adminUser.id, school.id);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(adminUser.id);
			});

			it('should call authorization service checkPermission', async () => {
				const { adminUser, school } = setup();
				const expectedPermissions = {
					action: 'read',
					requiredPermissions: ['COURSE_ADMINISTRATION'],
				};
				await uc.getCourseInfo(adminUser.id, school.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(adminUser, school, expectedPermissions);
			});

			it('should call user service findById', async () => {
				const { user, adminUser, school } = setup();

				await uc.getCourseInfo(adminUser.id, school.id);

				expect(userService.findById).toHaveBeenCalledWith(user.id);
			});

			it('should call class service findById', async () => {
				const { clazz, adminUser, school } = setup();

				await uc.getCourseInfo(adminUser.id, school.id);

				expect(classService.findById).toHaveBeenCalledWith(clazz.id);
			});
			it('should call group service findById', async () => {
				const { group, adminUser, school } = setup();

				await uc.getCourseInfo(adminUser.id, school.id);

				expect(groupService.findById).toHaveBeenCalledWith(group.id);
			});

			it('should call with default options', async () => {
				const { adminUser, school } = setup();
				const filter: CourseFilter = { schoolId: school.id, status: undefined };
				const options: IFindOptions<Course> = {
					order: {
						name: SortOrder.asc,
					},
					pagination: undefined,
				};

				await uc.getCourseInfo(adminUser.id, school.id);

				expect(courseDoService.getCourseInfo).toHaveBeenCalledWith(filter, options);
			});

			it('should call with non-default options and filter', async () => {
				const { school, adminUser } = setup();
				const filter: CourseFilter = { schoolId: school.id, status: CourseStatus.ARCHIVE };
				const options: IFindOptions<Course> = {
					order: {
						name: SortOrder.asc,
					},
					pagination: { skip: 0, limit: 5 },
				};

				await uc.getCourseInfo(
					adminUser.id,
					school.id,
					CourseSortProps.NAME,
					CourseStatus.ARCHIVE,
					{ skip: 0, limit: 5 },
					SortOrder.asc
				);

				expect(courseDoService.getCourseInfo).toHaveBeenCalledWith(filter, options);
			});
		});

		describe('when courses are found', () => {
			const setup = () => {
				const user = userFactory.withRoleByName(RoleName.TEACHER).buildWithId();
				const teacher = userDoFactory.build({ id: user.id, firstName: 'firstName', lastName: 'lastName' });
				const { adminUser } = UserAndAccountTestFactory.buildAdmin({}, [Permission.COURSE_ADMINISTRATION]);
				const group = groupFactory.build({ name: 'groupName' });
				const clazz = classFactory.build({ name: 'A', gradeLevel: 1 });
				const course1 = courseDoFactory.build({
					id: 'course1',
					name: 'course1',
					syncedWithGroup: group.id,
					teacherIds: [user.id],
					groupIds: [group.id],
					classIds: [clazz.id],
				});
				const course2 = courseDoFactory.build({
					id: 'course2',
					name: 'course2',
					teacherIds: [user.id],
					groupIds: [group.id],
					classIds: [clazz.id],
				});
				const school = schoolFactory.build();

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(adminUser);
				authorizationService.checkPermission.mockReturnValueOnce(undefined);
				groupService.findById.mockResolvedValue(group);
				userService.findById.mockResolvedValue(teacher);
				classService.findById.mockResolvedValue(clazz);
				courseDoService.getCourseInfo.mockResolvedValueOnce(new Page<Course>([course1, course2], 1));

				return {
					school,
					adminUser,
				};
			};

			it('should return courses with sorted and filtered results', async () => {
				const { school, adminUser } = setup();

				const result: Page<CourseInfoDto> = await uc.getCourseInfo(adminUser.id, school.id);

				expect(result.data[0]).toMatchObject({
					id: 'course1',
					name: 'course1',
					teachers: ['firstName lastName'],
					classes: ['1A', 'groupName'],
					syncedGroupName: 'groupName',
				});
				expect(result.data[1]).toMatchObject({
					id: 'course2',
					name: 'course2',
					teachers: ['firstName lastName'],
					classes: ['1A', 'groupName'],
					syncedGroupName: undefined,
				});
			});
		});

		describe('when user does not have permission', () => {
			const setup = () => {
				const { adminUser } = UserAndAccountTestFactory.buildAdmin({}, []);
				const school = schoolFactory.build();

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(adminUser);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return {
					school,
					adminUser,
				};
			};
			it('should throw an forbidden exception', async () => {
				const { school, adminUser } = setup();

				const getCourseInfo = async () => uc.getCourseInfo(adminUser.id, school.id);

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
			});
		});
	});
});
