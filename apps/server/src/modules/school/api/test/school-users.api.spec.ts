import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { serverConfig, ServerConfig, ServerTestModule } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TestConfigHelper } from '@testing/test-config.helper';
import { SchoolUserListResponse } from '../dto';
import { classEntityFactory } from '@modules/class/entity/testing/factory/class.entity.factory';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { User } from '@modules/user/repo';

describe('School Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let testConfigHelper: TestConfigHelper<ServerConfig>;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'school');

		const config = serverConfig();
		testConfigHelper = new TestConfigHelper(config);
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

	afterEach(() => {
		testConfigHelper.reset();
	});

	const mapUsersWithSchoolName = (users: User[], schoolName: string) => {
		return users.map((user) => ({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			schoolName,
		}));
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

				await em.persistAndFlush([teacherAccount, teacherUser]);
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

				await em.persistAndFlush([teacherAccount, teacherUser]);
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

				await em.persistAndFlush([teacherAccount, teacherUser, ...teachersOfSchool, ...publicTeachersOfSchool]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, teachersOfSchool, school, publicTeachersOfSchool };
			};

			it('should return only public teachers', async () => {
				const { loggedInClient, school, publicTeachersOfSchool } = await setup();
				testConfigHelper.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'opt-in');

				const response = await loggedInClient.get(`${school.id}/teachers`);
				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.data).toEqual(mapUsersWithSchoolName(publicTeachersOfSchool, school.name));
				expect(body.data.length).toEqual(publicTeachersOfSchool.length);
			});
		});

		describe('when user has no permission to view teachers', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const teacherRole = studentUser.roles[0];
				const teachersOfSchool = userFactory.buildList(3, { school, roles: [teacherRole] });

				await em.persistAndFlush([studentAccount, studentUser, ...teachersOfSchool]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, studentUser, teachersOfSchool, school };
			};

			it('should return 403', async () => {
				const { loggedInClient, school } = await setup();

				const response = await loggedInClient.get(`${school.id}/teachers`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has permission to view teachers', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const teacherRole = teacherUser.roles[0];
				const teachersOfSchool = userFactory.buildList(3, { school, roles: [teacherRole] });

				const otherSchool = schoolEntityFactory.build();
				const teachersOfOtherSchool = userFactory.buildList(3, { school: otherSchool, roles: [teacherRole] });

				await em.persistAndFlush([teacherAccount, teacherUser, ...teachersOfSchool, ...teachersOfOtherSchool]);
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

				await em.persistAndFlush([teacherAccount, teacherUser]);
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

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should not return any users', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`/${someId}/students`);

				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.data.length).toEqual(0);
			});
		});

		describe('when user has no permission to view all students', () => {
			beforeEach(() => {
				Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT', false);
			});

			afterEach(() => {
				Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT', true);
			});

			const setup = async (includeTeacherAsStudent: boolean = false) => {
				const school = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const studentRole = studentUser.roles[0];
				const studentsOfSchoolInClass = userFactory.buildList(2, { school, roles: [studentRole] });
				const studentsOfSchoolWithoutClass = userFactory.buildList(4, { school, roles: [studentRole] });

				await em.persistAndFlush([
					teacherAccount,
					teacherUser,
					studentUser,
					...studentsOfSchoolInClass,
					...studentsOfSchoolWithoutClass,
				]);

				const studentIdsInClass = studentsOfSchoolInClass.map((student) => student._id);
				const classUserIds = includeTeacherAsStudent ? [teacherUser._id, ...studentIdsInClass] : studentIdsInClass;
				const classWithStudents = classEntityFactory.buildWithId({
					teacherIds: includeTeacherAsStudent ? [] : [teacherUser._id],
					userIds: classUserIds,
					schoolId: school.id,
				});

				await em.persistAndFlush([classWithStudents]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, school, studentsOfSchoolInClass, studentsOfSchoolWithoutClass, teacherUser };
			};

			describe('when user is assigned as user in class', () => {
				it('should return 200 with students from class', async () => {
					const { loggedInClient, school, studentsOfSchoolInClass, studentsOfSchoolWithoutClass, teacherUser } =
						await setup(true);

					const response = await loggedInClient.get(`${school.id}/students`);

					const body = response.body as SchoolUserListResponse;

					expect(response.status).toEqual(HttpStatus.OK);
					expect(body.data).toEqual([
						{
							id: teacherUser.id,
							firstName: teacherUser.firstName,
							lastName: teacherUser.lastName,
							schoolName: school.name,
						},
						...mapUsersWithSchoolName(studentsOfSchoolInClass, school.name),
					]);
					expect(body.data).not.toEqual([mapUsersWithSchoolName(studentsOfSchoolWithoutClass, school.name)]);
					expect(body.data.length).toEqual(studentsOfSchoolInClass.length + 1);
				});
			});

			describe('when user is teacher of class', () => {
				it('should return 200 with students from class', async () => {
					const { loggedInClient, school, studentsOfSchoolInClass, studentsOfSchoolWithoutClass } = await setup(false);

					const response = await loggedInClient.get(`${school.id}/students`);

					const body = response.body as SchoolUserListResponse;

					expect(response.status).toEqual(HttpStatus.OK);
					expect(body.data).toEqual([...mapUsersWithSchoolName(studentsOfSchoolInClass, school.name)]);
					expect(body.data).not.toEqual([...mapUsersWithSchoolName(studentsOfSchoolWithoutClass, school.name)]);

					expect(body.data.length).toEqual(studentsOfSchoolInClass.length);
				});
			});
		});

		describe('when user has correct permission to view students but is not in the correct school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const otherSchool = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: otherSchool });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const studentRole = studentUser.roles[0];
				const studentsOfSchool = userFactory.buildList(3, { school, roles: [studentRole] });

				await em.persistAndFlush([teacherAccount, teacherUser, studentAccount, studentUser, ...studentsOfSchool]);
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
				const school = schoolEntityFactory.build();
				const otherSchool = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school: otherSchool });
				const studentRole = studentUser.roles[0];
				const studentsOfSchool = userFactory.buildList(3, { school, roles: [studentRole] });

				await em.persistAndFlush([studentUser, studentAccount, teacherAccount, teacherUser, ...studentsOfSchool]);
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
