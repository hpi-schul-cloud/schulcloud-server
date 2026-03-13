import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { classEntityFactory } from '@modules/class/entity/testing';
import { courseEntityFactory } from '@modules/course/testing';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { systemEntityFactory } from '@modules/system/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain/interface';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { GroupEntityTypes } from '../../entity';
import { groupEntityFactory } from '../../testing';
import { ClassRootType } from '../../uc/dto';
import { ClassInfoSearchListResponse } from '../dto';
import { ClassSortQueryType } from '../dto/interface';

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

	const setupRoles = async () => {
		const adminRole = roleFactory.buildWithId({ name: RoleName.ADMINISTRATOR });
		const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
		const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
		await em.persist([adminRole, teacherRole, studentRole]).flush();
		em.clear();

		return { adminRole, teacherRole, studentRole };
	};

	const setupGroupUsers = (users: User[], role: Role) =>
		users.map((user) => {
			return {
				user,
				role,
			};
		});

	describe('[GET] /groups/class', () => {
		describe('when an admin requests a list of classes', () => {
			const setup = async () => {
				const { teacherRole, studentRole } = await setupRoles();
				const schoolYear = schoolYearEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId({ currentYear: schoolYear });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				const groupStudents = userFactory.buildListWithId(3, { school, roles: [studentRole] });

				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRole] });
				const system = systemEntityFactory.buildWithId();
				const classEntity = classEntityFactory.buildWithId({
					name: 'Group A',
					schoolId: school._id,
					teacherIds: [teacherUser._id],
					source: undefined,
					year: schoolYear.id,
					userIds: groupStudents.map((s) => s._id),
				});

				const group = groupEntityFactory.buildWithId({
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
						...setupGroupUsers(groupStudents, studentRole),
					],
				});
				const course = courseEntityFactory.buildWithId({ syncedWithGroup: group });

				await em
					.persist([school, adminAccount, adminUser, teacherUser, system, classEntity, group, schoolYear, course])
					.flush();
				em.clear();

				const adminClient = await testApiClient.login(adminAccount);

				return {
					adminClient,
					group,
					classEntity,
					system,
					adminUser,
					teacherUser,
					schoolYear,
					course,
				};
			};

			it('should return the classes of his school', async () => {
				const { adminClient, group, classEntity, system, schoolYear, course, teacherUser, adminUser } = await setup();

				const response = await adminClient.get(`/class`).query({
					skip: 0,
					limit: 2,
					sortBy: ClassSortQueryType.NAME,
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
							teacherNames: [`${adminUser.firstName} ${adminUser.lastName}`],
							studentCount: 3,
							synchronizedCourses: [{ id: course.id, name: course.name }],
						},
						{
							id: classEntity.id,
							type: ClassRootType.CLASS,
							name: classEntity.gradeLevel ? `${classEntity.gradeLevel}${classEntity.name}` : classEntity.name,
							teacherNames: [`${teacherUser.firstName} ${teacherUser.lastName}`],
							schoolYear: schoolYear.name,
							isUpgradable: false,
							studentCount: 3,
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
					const school = schoolEntityFactory.buildWithId();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

					const group = groupEntityFactory.buildWithId({
						users: [
							{
								user: teacherUser,
								role: teacherUser.roles[0],
							},
						],
						organization: school,
					});

					await em.persist([teacherAccount, teacherUser, group]).flush();
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
						validPeriod: {
							from: group.validPeriod?.from.toISOString(),
							until: group.validPeriod?.until.toISOString(),
						},
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

					await em.persist([teacherAccount, teacherUser]).flush();
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

				const group = groupEntityFactory.buildWithId();

				await em.persist([studentAccount, studentUser, group]).flush();
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
				const school = schoolEntityFactory.buildWithId();
				const otherSchool = schoolEntityFactory.buildWithId();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				const groupInSchool = groupEntityFactory.buildWithId({
					organization: school,
					users: [
						{
							user: adminUser,
							role: adminUser.roles[0],
						},
					],
					type: GroupEntityTypes.COURSE,
				});
				const availableGroupInSchool = groupEntityFactory.buildWithId({
					organization: school,
					users: [
						{
							user: adminUser,
							role: adminUser.roles[0],
						},
					],
					type: GroupEntityTypes.COURSE,
				});
				const groupInOtherSchool = groupEntityFactory.buildWithId({
					organization: otherSchool,
					users: [
						{
							user: adminUser,
							role: adminUser.roles[0],
						},
					],
					type: GroupEntityTypes.COURSE,
				});

				const syncedCourse = courseEntityFactory.build({
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
					validPeriod: {
						from: availableGroupInSchool.validPeriod?.from.toISOString(),
						until: availableGroupInSchool.validPeriod?.until.toISOString(),
					},
					externalSource: {
						externalId: availableGroupInSchool.externalSource?.externalId,
						systemId: availableGroupInSchool.externalSource?.system.id,
					},
				};

				const nameQuery: string = availableGroupInSchool.name.slice(-2);

				await em
					.persist([
						adminAccount,
						adminUser,
						groupInSchool,
						availableGroupInSchool,
						groupInOtherSchool,
						school,
						otherSchool,
						syncedCourse,
					])
					.flush();
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
								validPeriod: {
									from: groupInSchool.validPeriod?.from.toISOString(),
									until: groupInSchool.validPeriod?.until.toISOString(),
								},
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
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

				const teachersGroup = groupEntityFactory.buildWithId({
					organization: school,
					users: [{ user: teacherUser, role: teacherUser.roles[0] }],
					type: GroupEntityTypes.COURSE,
				});
				const availableTeachersGroup = groupEntityFactory.buildWithId({
					organization: school,
					users: [{ user: teacherUser, role: teacherUser.roles[0] }],
					type: GroupEntityTypes.COURSE,
				});

				const syncedCourse = courseEntityFactory.build({
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
					validPeriod: {
						from: availableTeachersGroup.validPeriod?.from.toISOString(),
						until: availableTeachersGroup.validPeriod?.until.toISOString(),
					},
					externalSource: {
						externalId: availableTeachersGroup.externalSource?.externalId,
						systemId: availableTeachersGroup.externalSource?.system.id,
					},
				};

				const nameQuery: string = availableTeachersGroup.name.slice(-2);

				await em
					.persist([teacherAccount, teacherUser, teachersGroup, availableTeachersGroup, school, syncedCourse])
					.flush();
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
								validPeriod: {
									from: teachersGroup.validPeriod?.from.toISOString(),
									until: teachersGroup.validPeriod?.until.toISOString(),
								},
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

				await em.persist([studentAccount, studentUser]).flush();
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
