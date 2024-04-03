import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ClassEntity } from '@modules/class/entity';
import { classEntityFactory } from '@modules/class/entity/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	Course as CourseEntity,
	Role,
	SchoolEntity,
	SchoolYearEntity,
	SystemEntity,
	User,
} from '@shared/domain/entity';
import { RoleName, SortOrder } from '@shared/domain/interface';
import {
	courseFactory as courseEntityFactory,
	groupEntityFactory,
	roleFactory,
	schoolEntityFactory,
	schoolYearFactory,
	systemEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { GroupEntity, GroupEntityTypes } from '../../entity';
import { ClassRootType } from '../../uc/dto/class-root-type';
import { ClassInfoSearchListResponse } from '../dto';
import { ClassSortBy } from '../dto/interface';

const baseRouteName = '/groups';

describe('Group (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('[GET] /groups/class', () => {
		describe('when an admin requests a list of classes', () => {
			const setup = async () => {
				const schoolYear: SchoolYearEntity = schoolYearFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({ currentYear: schoolYear });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				const teacherRole: Role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const teacherUser: User = userFactory.buildWithId({ school, roles: [teacherRole] });
				const system: SystemEntity = systemEntityFactory.buildWithId();
				const clazz: ClassEntity = classEntityFactory.buildWithId({
					name: 'Group A',
					schoolId: school._id,
					teacherIds: [teacherUser._id],
					source: undefined,
					year: schoolYear.id,
				});
				const group: GroupEntity = groupEntityFactory.buildWithId({
					name: 'Group B',
					type: GroupEntityTypes.CLASS,
					externalSource: {
						externalId: 'externalId',
						system,
					},
					organization: school,
					users: [
						{
							user: adminUser,
							role: teacherRole,
						},
					],
				});
				const course: CourseEntity = courseEntityFactory.buildWithId({ syncedWithGroup: group });

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					teacherRole,
					teacherUser,
					system,
					clazz,
					group,
					schoolYear,
					course,
				]);
				em.clear();

				const adminClient = await testApiClient.login(adminAccount);

				return {
					adminClient,
					group,
					clazz,
					system,
					adminUser,
					teacherUser,
					schoolYear,
					course,
				};
			};

			it('should return the classes of his school', async () => {
				const { adminClient, group, clazz, system, schoolYear, course } = await setup();

				const response = await adminClient.get(`/class`).query({
					skip: 0,
					limit: 2,
					sortBy: ClassSortBy.NAME,
					sortOrder: SortOrder.desc,
				});

				expect(response.body).toEqual<ClassInfoSearchListResponse>({
					total: 2,
					data: [
						{
							id: group.id,
							type: ClassRootType.GROUP,
							name: group.name,
							externalSourceName: system.displayName,
							teacherNames: [],
							studentCount: 0,
							synchronizedCourses: [{ id: course.id, name: course.name }],
						},
						{
							id: clazz.id,
							type: ClassRootType.CLASS,
							name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
							teacherNames: [],
							schoolYear: schoolYear.name,
							isUpgradable: false,
							studentCount: 0,
						},
					],
					skip: 0,
					limit: 2,
				});
			});
		});
	});

	describe('[GET] /groups/:groupId', () => {
		describe('when authorized user requests a group', () => {
			describe('when group exists', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

					const group: GroupEntity = groupEntityFactory.buildWithId({
						users: [
							{
								user: teacherUser,
								role: teacherUser.roles[0],
							},
						],
						organization: school,
					});

					await em.persistAndFlush([teacherAccount, teacherUser, group]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return {
						loggedInClient,
						group,
						teacherUser,
					};
				};

				it('should return the group', async () => {
					const { loggedInClient, group, teacherUser } = await setup();

					const response = await loggedInClient.get(`${group.id}`);

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						id: group.id,
						name: group.name,
						organizationId: group.organization?.id,
						type: group.type,
						users: [
							{
								id: teacherUser.id,
								firstName: teacherUser.firstName,
								lastName: teacherUser.lastName,
								role: teacherUser.roles[0].name,
							},
						],
						externalSource: {
							externalId: group.externalSource?.externalId,
							systemId: group.externalSource?.system.id,
						},
					});
				});
			});

			describe('when group does not exist', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					await em.persistAndFlush([teacherAccount, teacherUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return {
						loggedInClient,
					};
				};

				it('should return not found', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get(`${new ObjectId().toHexString()}`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
					expect(response.body).toEqual({
						code: HttpStatus.NOT_FOUND,
						message: 'Not Found',
						title: 'Not Found',
						type: 'NOT_FOUND',
					});
				});
			});
		});

		describe('when unauthorized user requests a group', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const group: GroupEntity = groupEntityFactory.buildWithId();

				await em.persistAndFlush([studentAccount, studentUser, group]);
				em.clear();

				return {
					groupId: group.id,
				};
			};

			it('should return unauthorized', async () => {
				const { groupId } = await setup();

				const response = await testApiClient.get(`${groupId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});

	describe('[GET] /groups', () => {
		describe('when admin requests groups', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const otherSchool: SchoolEntity = schoolEntityFactory.buildWithId();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				const groupInSchool: GroupEntity = groupEntityFactory.buildWithId({
					organization: school,
					users: [
						{
							user: adminUser,
							role: adminUser.roles[0],
						},
					],
				});
				const availableGroupInSchool: GroupEntity = groupEntityFactory.buildWithId({
					organization: school,
					users: [
						{
							user: adminUser,
							role: adminUser.roles[0],
						},
					],
				});
				const groupInOtherSchool: GroupEntity = groupEntityFactory.buildWithId({
					organization: otherSchool,
					users: [
						{
							user: adminUser,
							role: adminUser.roles[0],
						},
					],
				});

				const syncedCourse: CourseEntity = courseEntityFactory.build({
					school,
					syncedWithGroup: groupInSchool,
				});

				const expectGroup = {
					id: availableGroupInSchool.id,
					name: availableGroupInSchool.name,
					organizationId: availableGroupInSchool.organization?.id,
					type: availableGroupInSchool.type,
					users: [
						{
							id: adminUser.id,
							firstName: adminUser.firstName,
							lastName: adminUser.lastName,
							role: adminUser.roles[0].name,
						},
					],
					externalSource: {
						externalId: availableGroupInSchool.externalSource?.externalId,
						systemId: availableGroupInSchool.externalSource?.system.id,
					},
				};

				const nameQuery: string = availableGroupInSchool.name.slice(-2);

				await em.persistAndFlush([
					adminAccount,
					adminUser,
					groupInSchool,
					availableGroupInSchool,
					groupInOtherSchool,
					school,
					otherSchool,
					syncedCourse,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					groupInSchool,
					adminUser,
					expectGroup,
					nameQuery,
				};
			};

			describe('when requesting all groups', () => {
				it('should return all groups of the school', async () => {
					const { loggedInClient, groupInSchool, expectGroup, adminUser } = await setup();

					const response = await loggedInClient.get();

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [
							{
								id: groupInSchool.id,
								name: groupInSchool.name,
								organizationId: groupInSchool.organization?.id,
								type: groupInSchool.type,
								users: [
									{
										id: adminUser.id,
										firstName: adminUser.firstName,
										lastName: adminUser.lastName,
										role: adminUser.roles[0].name,
									},
								],
								externalSource: {
									externalId: groupInSchool.externalSource?.externalId,
									systemId: groupInSchool.externalSource?.system.id,
								},
							},
							expectGroup,
						],
						limit: 10,
						skip: 0,
						total: 2,
					});
				});

				it('should return groups according to pagination', async () => {
					const { loggedInClient, expectGroup } = await setup();

					const response = await loggedInClient.get().query({ skip: 1, limit: 1 });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 1,
						skip: 1,
						total: 2,
					});
				});

				it('should return groups according to name query', async () => {
					const { loggedInClient, expectGroup, nameQuery } = await setup();

					const response = await loggedInClient.get().query({ nameQuery });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 10,
						skip: 0,
						total: 1,
					});
				});
			});

			describe('when requesting all available groups', () => {
				it('should return all available groups for course sync', async () => {
					const { loggedInClient, expectGroup } = await setup();

					const response = await loggedInClient.get().query({ availableGroupsForCourseSync: true });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 10,
						skip: 0,
						total: 1,
					});
				});

				it('should return available groups according to pagination', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get().query({ availableGroupsForCourseSync: true, skip: 1, limit: 1 });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({ data: [], limit: 1, skip: 1, total: 1 });
				});

				it('should return available groups according to name query', async () => {
					const { loggedInClient, expectGroup, nameQuery } = await setup();

					const response = await loggedInClient.get().query({ availableGroupsForCourseSync: true, nameQuery });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 10,
						skip: 0,
						total: 1,
					});
				});
			});
		});

		describe('when teacher requests groups', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

				const teachersGroup: GroupEntity = groupEntityFactory.buildWithId({
					organization: school,
					users: [{ user: teacherUser, role: teacherUser.roles[0] }],
				});
				const availableTeachersGroup: GroupEntity = groupEntityFactory.buildWithId({
					organization: school,
					users: [{ user: teacherUser, role: teacherUser.roles[0] }],
				});
				const groupWithoutTeacher: GroupEntity = groupEntityFactory.buildWithId({ organization: school });

				const syncedCourse: CourseEntity = courseEntityFactory.build({
					school,
					syncedWithGroup: teachersGroup,
				});

				const expectGroup = {
					id: availableTeachersGroup.id,
					name: availableTeachersGroup.name,
					organizationId: availableTeachersGroup.organization?.id,
					type: availableTeachersGroup.type,
					users: [
						{
							id: teacherUser.id,
							firstName: teacherUser.firstName,
							lastName: teacherUser.lastName,
							role: teacherUser.roles[0].name,
						},
					],
					externalSource: {
						externalId: availableTeachersGroup.externalSource?.externalId,
						systemId: availableTeachersGroup.externalSource?.system.id,
					},
				};

				const nameQuery: string = availableTeachersGroup.name.slice(-2);

				await em.persistAndFlush([
					teacherAccount,
					teacherUser,
					teachersGroup,
					availableTeachersGroup,
					groupWithoutTeacher,
					school,
					syncedCourse,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					teachersGroup,
					expectGroup,
					teacherUser,
					nameQuery,
				};
			};

			describe('when requesting all groups', () => {
				it('should return all groups the teacher is part of', async () => {
					const { loggedInClient, teachersGroup, expectGroup, teacherUser } = await setup();

					const response = await loggedInClient.get();

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [
							{
								id: teachersGroup.id,
								name: teachersGroup.name,
								organizationId: teachersGroup.organization?.id,
								type: teachersGroup.type,
								users: [
									{
										id: teacherUser.id,
										firstName: teacherUser.firstName,
										lastName: teacherUser.lastName,
										role: teacherUser.roles[0].name,
									},
								],
								externalSource: {
									externalId: teachersGroup.externalSource?.externalId,
									systemId: teachersGroup.externalSource?.system.id,
								},
							},
							expectGroup,
						],
						limit: 10,
						skip: 0,
						total: 2,
					});
				});

				it('should return all groups according to pagination', async () => {
					const { loggedInClient, expectGroup } = await setup();

					const response = await loggedInClient.get().query({ skip: 1, limit: 1 });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 1,
						skip: 1,
						total: 2,
					});
				});

				it('should return all groups according to name query', async () => {
					const { loggedInClient, expectGroup, nameQuery } = await setup();

					const response = await loggedInClient.get().query({ nameQuery });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 10,
						skip: 0,
						total: 1,
					});
				});
			});

			describe('when requesting all available groups', () => {
				it('should return all available groups for course sync the teacher is part of', async () => {
					const { loggedInClient, expectGroup } = await setup();

					const response = await loggedInClient.get().query({ availableGroupsForCourseSync: true });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 10,
						skip: 0,
						total: 1,
					});
				});

				it('should return all available groups according to pagination', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get().query({ availableGroupsForCourseSync: true, skip: 1, limit: 1 });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({ data: [], limit: 1, skip: 1, total: 1 });
				});

				it('should return all available groups according to name query', async () => {
					const { loggedInClient, expectGroup, nameQuery } = await setup();

					const response = await loggedInClient.get().query({ availableGroupsForCourseSync: true, nameQuery });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual({
						data: [expectGroup],
						limit: 10,
						skip: 0,
						total: 1,
					});
				});
			});
		});

		describe('when unauthorized user requests groups', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();
			};

			it('should return unauthorized', async () => {
				await setup();

				const response = await testApiClient.get();

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});
});
