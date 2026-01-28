import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { AUTHORIZATION_CONFIG_TOKEN, AuthorizationConfig } from '@modules/authorization';
import { classEntityFactory } from '@modules/class/entity/testing/factory/class.entity.factory';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { SchoolUserListResponse } from '../dto';

describe('School Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let authorizationConfig: AuthorizationConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'school');
		authorizationConfig = moduleFixture.get<AuthorizationConfig>(AUTHORIZATION_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		await em.clearCache('roles-cache-byname-teacher');
		await em.clearCache('roles-cache-bynames-teacher');
		await em.clearCache('roles-cache-byname-student');
		await em.clearCache('roles-cache-bynames-student');
	});

	afterAll(async () => {
		await app.close();
	});

	const mapUsersWithSchoolName = (users: User[], schoolName: string) => {
		const members = users.map((user) => {
			return {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				schoolName,
			};
		});
		return members;
	};

	describe('get Teachers', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`${someId}/teachers`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when schoolId is invalid format', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persist([teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`/123/teachers`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] }],
					})
				);
			});
		});

		describe('when schoolId doesnt exist', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persist([teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return 404', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`/${someId}/teachers`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not in the correct school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const otherSchool = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: otherSchool });
				const teacherRole = teacherUser.roles[0];
				const teachersOfSchool = userFactory.buildList(3, { school, roles: [teacherRole] });
				const publicTeachersOfSchool = userFactory.buildList(2, { school, roles: [teacherRole], discoverable: true });

				await em.persist([teacherAccount, teacherUser, ...teachersOfSchool, ...publicTeachersOfSchool]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, teachersOfSchool, school, publicTeachersOfSchool };
			};

			it('should return only public teachers', async () => {
				const { loggedInClient, school, publicTeachersOfSchool } = await setup();

				const response = await loggedInClient.get(`${school.id}/teachers`);
				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.data).toEqual(mapUsersWithSchoolName(publicTeachersOfSchool, school.name));
				expect(body.data.length).toEqual(publicTeachersOfSchool.length);
			});
		});

		describe('when user is a student', () => {
			const setup = async (config: { sameSchool: boolean }) => {
				const teachersSchool = schoolEntityFactory.build();
				const userSchool = config.sameSchool ? teachersSchool : schoolEntityFactory.build();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
					school: userSchool,
				});
				const studentRole = studentUser.roles[0];
				const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const teachersOfSchool = userFactory.buildList(3, { school: teachersSchool, roles: [studentRole] });

				await em
					.persist([
						studentAccount,
						studentUser,
						...teachersOfSchool,
						studentRole,
						teacherRole,
						teachersSchool,
						userSchool,
					])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, studentUser, teachersOfSchool, school: teachersSchool };
			};

			describe('when user is from different school', () => {
				it('should return 401', async () => {
					const { loggedInClient, school } = await setup({ sameSchool: false });

					const response = await loggedInClient.get(`${school.id}/teachers`);

					expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when user is from same school', () => {
				it('should return 200', async () => {
					const { loggedInClient, school } = await setup({ sameSchool: true });

					const response = await loggedInClient.get(`${school.id}/teachers`);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});
		});

		describe('when user is a teacher', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const teacherRole = teacherUser.roles[0];
				const teachersOfSchool = userFactory.buildList(3, { school, roles: [teacherRole] });

				const otherSchool = schoolEntityFactory.build();
				const teachersOfOtherSchool = userFactory.buildList(3, { school: otherSchool, roles: [teacherRole] });

				await em.persist([teacherAccount, teacherUser, ...teachersOfSchool, ...teachersOfOtherSchool]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, teachersOfSchool, school };
			};

			it('should return 200 with teachers', async () => {
				const { loggedInClient, teacherUser, teachersOfSchool, school } = await setup();

				const response = await loggedInClient.get(`${school.id}/teachers`);

				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.data).toEqual([
					{
						id: teacherUser.id,
						firstName: teacherUser.firstName,
						lastName: teacherUser.lastName,
						schoolName: school.name,
					},
					...mapUsersWithSchoolName(teachersOfSchool, school.name),
				]);
			});
		});
	});

	describe('get Students', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`${someId}/students`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when schoolId is invalid format', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persist([teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`/123/students`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] }],
					})
				);
			});
		});

		describe('when schoolId doesnt exist', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persist([teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should not return any users', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`/${someId}/students`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user has no permission to view all students', () => {
			beforeEach(() => {
				authorizationConfig.teacherStudentVisibilityIsEnabledByDefault = false;
			});

			afterEach(() => {
				authorizationConfig.teacherStudentVisibilityIsEnabledByDefault = true;
			});

			const setup = async (userRole: 'teacher' | 'student', config: { sameSchool?: boolean }) => {
				const school = schoolEntityFactory.build();
				const userSchool = config.sameSchool ? school : schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: userSchool });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school: userSchool });

				await em.persist([teacherAccount, teacherUser, studentUser, studentAccount, userSchool, school]).flush();

				const { studentIds: studentIdsOfCurrentClass } = await buildClassWithAdditionalStudents({
					teacherUser,
					studentUser,
					school,
				});

				const { studentIds: studentIdsOfArchivedClass } = await buildClassWithAdditionalStudents({
					teacherUser,
					studentUser,
					school,
					archived: true,
				});

				const { studentIds: studentIdsOfMoinSchuleClass } = await buildMoinSchuleClassWithAdditionalStudents({
					teacherUser,
					studentUser,
					school,
				});

				const { studentIds: studentIdsOfArchivedMoinSchuleClass } = await buildMoinSchuleClassWithAdditionalStudents({
					teacherUser,
					studentUser,
					school,
					archived: true,
				});

				const { userIds: studentIdsOfUsersWithoutClass } = await buildUsersWithoutClass(studentUser.roles[0], school);

				const loggedInClient =
					userRole === 'teacher'
						? await testApiClient.login(teacherAccount)
						: await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					school,
					studentIdsOfArchivedClass,
					studentIdsOfCurrentClass,
					studentIdsOfMoinSchuleClass,
					studentIdsOfArchivedMoinSchuleClass,
					studentIdsOfUsersWithoutClass,
				};
			};

			describe('user is student', () => {
				describe('user is from same school', () => {
					it('should include all students from users classes', async () => {
						const { loggedInClient, school, studentIdsOfCurrentClass, studentIdsOfMoinSchuleClass } = await setup(
							'student',
							{ sameSchool: true }
						);

						const response = await loggedInClient.get(`${school.id}/students`);
						const body = response.body as SchoolUserListResponse;
						const recievedIds = body.data.map((user) => user.id);

						expect(recievedIds).toEqual(expect.arrayContaining(studentIdsOfCurrentClass.map((id) => id.toString())));
						expect(recievedIds).toEqual(expect.arrayContaining(studentIdsOfMoinSchuleClass.map((id) => id.toString())));
					});

					it('should not include students not in class', async () => {
						const { loggedInClient, school, studentIdsOfUsersWithoutClass } = await setup('student', {
							sameSchool: false,
						});

						const response = await loggedInClient.get(`${school.id}/students`);
						const body = response.body as SchoolUserListResponse;
						const recievedIds = body.data.map((user) => user.id);

						expect(recievedIds).not.toEqual(
							expect.arrayContaining(studentIdsOfUsersWithoutClass.map((id) => id.toString()))
						);
					});

					it('should not include students from archived classes', async () => {
						const { loggedInClient, school, studentIdsOfArchivedMoinSchuleClass, studentIdsOfArchivedClass } =
							await setup('student', {
								sameSchool: false,
							});

						const response = await loggedInClient.get(`${school.id}/students`);
						const body = response.body as SchoolUserListResponse;
						const recievedIds = body.data.map((user) => user.id);

						expect(recievedIds).not.toEqual(
							expect.arrayContaining(studentIdsOfArchivedClass.map((id) => id.toString()))
						);
						expect(recievedIds).not.toEqual(
							expect.arrayContaining(studentIdsOfArchivedMoinSchuleClass.map((id) => id))
						);
					});
				});

				describe('user is from different school', () => {
					it('should return no students', async () => {
						const { loggedInClient, school } = await setup('student', {
							sameSchool: false,
						});

						const response = await loggedInClient.get(`${school.id}/students`);
						const body = response.body as SchoolUserListResponse;
						const recievedIds = body.data.map((user) => user.id);

						expect(recievedIds.length).toEqual(0);
					});
				});
			});

			describe('user is teacher', () => {
				describe('user is from same school', () => {
					it('should include all students from school', async () => {
						const { loggedInClient, school, studentIdsOfCurrentClass, studentIdsOfMoinSchuleClass } = await setup(
							'teacher',
							{ sameSchool: true }
						);

						const response = await loggedInClient.get(`${school.id}/students`);
						const body = response.body as SchoolUserListResponse;
						const recievedIds = body.data.map((user) => user.id);

						expect(recievedIds).toEqual(expect.arrayContaining(studentIdsOfCurrentClass.map((id) => id.toString())));
						expect(recievedIds).toEqual(expect.arrayContaining(studentIdsOfMoinSchuleClass.map((id) => id.toString())));
					});

					it('should include students from moin.schule class', async () => {
						const { loggedInClient, school, studentIdsOfMoinSchuleClass } = await setup('teacher', {
							sameSchool: true,
						});

						const response = await loggedInClient.get(`${school.id}/students`);
						const body = response.body as SchoolUserListResponse;
						const recievedIds = body.data.map((user) => user.id);

						expect(recievedIds).toEqual(expect.arrayContaining(studentIdsOfMoinSchuleClass.map((id) => id.toString())));
					});
				});

				describe('user is from different school', () => {
					it('should return no students', async () => {
						const { loggedInClient, school } = await setup('student', {
							sameSchool: false,
						});

						const response = await loggedInClient.get(`${school.id}/students`);
						const body = response.body as SchoolUserListResponse;
						const recievedIds = body.data.map((user) => user.id);

						expect(recievedIds.length).toEqual(0);
					});
				});
			});

			const buildClassWithAdditionalStudents = async (data: {
				teacherUser: User;
				studentUser: User;
				school: SchoolEntity;
				archived?: boolean;
			}) => {
				const studentRole = data.studentUser.roles[0];
				const studentsOfSchoolInClass = userFactory.buildListWithId(2, { school: data.school, roles: [studentRole] });
				const studentIds = [data.studentUser._id, ...studentsOfSchoolInClass.map((student) => student._id)];
				const classYear = data.archived ? schoolYearEntityFactory.buildWithId() : data.school.currentYear;
				expect(classYear?._id).toBeDefined();

				const createdClass = classEntityFactory.buildWithId({
					teacherIds: [data.teacherUser._id],
					userIds: studentIds,
					schoolId: data.school.id,
					year: classYear?._id,
				});

				await em.persist([createdClass, ...studentsOfSchoolInClass]).flush();

				return { createdClass, studentIds };
			};

			const buildMoinSchuleClassWithAdditionalStudents = async (data: {
				teacherUser: User;
				studentUser: User;
				school: SchoolEntity;
				archived?: boolean;
			}) => {
				const studentRole = data.studentUser.roles[0];
				const teacherRole = data.teacherUser.roles[0];

				const studentsOfSchoolInMoinSchuleClass = userFactory.buildListWithId(2, {
					school: data.school,
					roles: [studentRole],
				});

				const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
				const lastYear = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365);
				const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
				const validPeriod = { from: lastYear, until: data.archived ? yesterday : tomorrow };

				const moinSchuleClass = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.CLASS,
					users: [
						{ user: data.teacherUser, role: teacherRole },
						{ user: data.studentUser, role: studentRole },
						...studentsOfSchoolInMoinSchuleClass.map((user) => {
							return {
								user: user,
								role: studentRole,
							};
						}),
					],
					organization: data.school,
					validPeriod,
				});

				const studentIds = [data.studentUser._id, ...studentsOfSchoolInMoinSchuleClass.map((student) => student._id)];

				await em.persist([moinSchuleClass, ...studentsOfSchoolInMoinSchuleClass]).flush();

				return { moinSchuleClass, studentIds };
			};

			const buildUsersWithoutClass = async (role: Role, school: SchoolEntity) => {
				const users = userFactory.buildList(2, {
					school: school,
					roles: [role],
				});

				await em.persist(users).flush();

				const userIds = users.map((user) => user._id);

				return { userIds };
			};
		});

		describe('when user has correct permission to view students but is not in the correct school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const otherSchool = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: otherSchool });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const studentRole = studentUser.roles[0];
				const studentsOfSchool = userFactory.buildList(3, { school, roles: [studentRole] });

				await em.persist([teacherAccount, teacherUser, studentAccount, studentUser, ...studentsOfSchool]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, school };
			};

			it('should not return any users', async () => {
				const { loggedInClient, school } = await setup();

				const response = await loggedInClient.get(`${school.id}/students`);
				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.data.length).toEqual(0);
			});
		});

		describe('when user has permission to view students and is in the correct school', () => {
			const setup = async () => {
				authorizationConfig.teacherStudentVisibilityIsEnabledByDefault = true;
				const school = schoolEntityFactory.build();
				const otherSchool = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school: otherSchool });
				const studentRole = studentUser.roles[0];
				const studentsOfSchool = userFactory.buildList(3, { school, roles: [studentRole] });

				await em.persist([studentUser, studentAccount, teacherAccount, teacherUser, ...studentsOfSchool]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, studentsOfSchool, school };
			};

			it('should return 200 with students from own school', async () => {
				const { loggedInClient, studentsOfSchool, school } = await setup();

				const response = await loggedInClient.get(`${school.id}/students`);

				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.data).toEqual([...mapUsersWithSchoolName(studentsOfSchool, school.name)]);
				expect(body.data.length).toEqual(studentsOfSchool.length);
			});
		});
	});
});
