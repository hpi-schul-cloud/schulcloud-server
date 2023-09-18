import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Permission, RoleName, User } from '@shared/domain';
import {
	accountFactory,
	roleFactory,
	schoolFactory,
	userFactory,
	TestApiClient,
	cleanupCollections,
} from '@shared/testing';
import {
	AccountSearchQueryParams,
	AccountSearchType,
	PatchMyAccountParams,
	PatchMyPasswordParams,
} from '@src/modules/account/controller/dto';
import { ServerTestModule } from '@src/modules/server/server.module';

describe('Account Controller (API)', () => {
	const basePath = '/account';

	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	// let adminAccount: Account;
	// let teacherAccount: Account;
	// let studentAccount: Account;
	// let superheroAccount: Account;

	// let adminUser: User;
	// let teacherUser: User;
	// let studentUser: User;
	// let superheroUser: User;

	// let currentUser: ICurrentUser;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const mapUserToAccount = (user: User): Account =>
		accountFactory.buildWithId({
			userId: user.id,
			username: user.email,
			password: defaultPasswordHash,
		});

	/* const setup = async () => {
		// TODO: revisit test structure. setup for each functional situation, return values instead of global variables
		const school = schoolFactory.buildWithId();

		const adminRoles = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
		});
		const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
		const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
		const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

		adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
		studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
		superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

		const mapUserToAccount = (user: User): Account =>
			accountFactory.buildWithId({
				userId: user.id,
				username: user.email,
				password: defaultPasswordHash,
			});
		adminAccount = mapUserToAccount(adminUser);
		teacherAccount = mapUserToAccount(teacherUser);
		studentAccount = mapUserToAccount(studentUser);
		superheroAccount = mapUserToAccount(superheroUser);

		em.persist(school);
		em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
		em.persist([adminUser, teacherUser, studentUser, superheroUser]);
		em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
		await em.flush();

		// TODO: return {adminAccount, teacherAccount, ...}
	}; */

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, basePath);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		// await cleanupCollections(em);
		await app.close();
	});

	describe('[PATCH] me/password', () => {
		describe('When patching with a valid password', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const studentAccount = mapUserToAccount(studentUser);

				em.persist(school);
				em.persist([studentRoles]);
				em.persist([studentUser]);
				em.persist([studentAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const passwordPatchParams: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { passwordPatchParams, loggedInClient, studentAccount };
			};

			it(`should update the current user's (temporary) password`, async () => {
				const { passwordPatchParams, loggedInClient, studentAccount } = await setup();

				await loggedInClient.patch('/me/password', passwordPatchParams).expect(200);

				const updatedAccount = await em.findOneOrFail(Account, studentAccount.id);
				expect(updatedAccount.password).not.toEqual(defaultPasswordHash);
			});
		});

		describe('When using a weak password', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const studentAccount = mapUserToAccount(studentUser);

				em.persist(school);
				em.persist([studentRoles]);
				em.persist([studentUser]);
				em.persist([studentAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const passwordPatchParams: PatchMyPasswordParams = {
					password: 'weak',
					confirmPassword: 'weak',
				};

				return { passwordPatchParams, loggedInClient };
			};

			it('should reject the password change', async () => {
				const { passwordPatchParams, loggedInClient } = await setup();

				await loggedInClient.patch('/me/password', passwordPatchParams).expect(400);
			});
		});
	});

	describe('[PATCH] me', () => {
		describe('When patching the account with account info', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const studentAccount = mapUserToAccount(studentUser);

				em.persist(school);
				em.persist([studentRoles]);
				em.persist([studentUser]);
				em.persist([studentAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const newEmailValue = 'new@mail.com';

				const patchMyAccountParams: PatchMyAccountParams = {
					passwordOld: defaultPassword,
					email: newEmailValue,
				};
				return { newEmailValue, patchMyAccountParams, loggedInClient, studentAccount };
			};
			it(`should update a users account`, async () => {
				const { newEmailValue, patchMyAccountParams, loggedInClient, studentAccount } = await setup();

				await loggedInClient.patch('/me', patchMyAccountParams).expect(200);

				const updatedAccount = await em.findOneOrFail(Account, studentAccount.id);
				expect(updatedAccount.username).toEqual(newEmailValue);
			});
		});

		describe('When patching with a not valid email', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const studentAccount = mapUserToAccount(studentUser);

				em.persist(school);
				em.persist([studentRoles]);
				em.persist([studentUser]);
				em.persist([studentAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const newEmailValue = 'new@mail.com';

				const patchMyAccountParams: PatchMyAccountParams = {
					passwordOld: defaultPassword,
					email: 'invalid',
				};
				return { newEmailValue, patchMyAccountParams, loggedInClient };
			};

			it('should reject patch request', async () => {
				const { patchMyAccountParams, loggedInClient } = await setup();

				await loggedInClient.patch('/me', patchMyAccountParams).expect(400);
			});
		});
	});

	describe('[GET]', () => {
		describe('When searching with a superhero user', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([studentRoles, superheroRoles]);
				em.persist([studentUser, superheroUser]);
				em.persist([studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const query: AccountSearchQueryParams = {
					type: AccountSearchType.USER_ID,
					value: studentUser.id,
					skip: 5,
					limit: 5,
				};

				return { query, loggedInClient };
			};
			it('should successfully search for user id', async () => {
				const { query, loggedInClient } = await setup();

				await loggedInClient.get().query(query).send().expect(200);
			});
		});

		// If skip is too big, just return an empty list.
		// We testing it here, because we are mocking the database in the use case unit tests
		// and for realistic behavior we need database.
		describe('When searching with a superhero user with large skip', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([studentRoles, superheroRoles]);
				em.persist([studentUser, superheroUser]);
				em.persist([studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const query: AccountSearchQueryParams = {
					type: AccountSearchType.USER_ID,
					value: studentUser.id,
					skip: 50000,
					limit: 5,
				};

				return { query, loggedInClient };
			};
			it('should search for user id', async () => {
				const { query, loggedInClient } = await setup();

				await loggedInClient.get().query(query).send().expect(200);
			});
		});

		describe('When searching with a superhero user', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([studentRoles, superheroRoles]);
				em.persist([studentUser, superheroUser]);
				em.persist([studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const query: AccountSearchQueryParams = {
					type: AccountSearchType.USERNAME,
					value: '',
					skip: 5,
					limit: 5,
				};

				return { query, loggedInClient };
			};
			it('should search for user name', async () => {
				const { query, loggedInClient } = await setup();

				await loggedInClient.get().query(query).send().expect(200);
			});
		});

		describe('When searching with a superhero user', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([studentRoles, superheroRoles]);
				em.persist([studentUser, superheroUser]);
				em.persist([studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const query: AccountSearchQueryParams = {
					type: '' as AccountSearchType,
					value: '',
					skip: 5,
					limit: 5,
				};

				return { query, loggedInClient };
			};

			it('should reject if type is unknown', async () => {
				const { query, loggedInClient } = await setup();

				await loggedInClient.get().query(query).send().expect(400);
			});
		});
		describe('When searching with an admin user (not authorized)', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });

				const adminAccount = mapUserToAccount(adminUser);
				const studentAccount = mapUserToAccount(studentUser);

				em.persist(school);
				em.persist([adminRoles, studentRoles]);
				em.persist([adminUser, studentUser]);
				em.persist([adminAccount, studentAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(adminAccount);

				const query: AccountSearchQueryParams = {
					type: AccountSearchType.USERNAME,
					value: '',
					skip: 5,
					limit: 5,
				};

				return { query, loggedInClient, studentAccount };
			};

			it('should reject search for user', async () => {
				const { query, loggedInClient } = await setup();

				await loggedInClient.get().query(query).send().expect(403);
			});
		});
	});

	/*
	describe('[GET] :id', () => {
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should return account for account id', async () => {
			// currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			await request(app.getHttpServer()) //
				.get(`${basePath}/${studentAccount.id}`)
				.expect(200);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject if id has invalid format', async () => {
			// currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			await request(app.getHttpServer()) //
				.get(`${basePath}/qwerty`)
				.send()
				.expect(400);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject if user is not a authorized', async () => {
			// currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			await request(app.getHttpServer()) //
				.get(`${basePath}/${studentAccount.id}`)
				.expect(403);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			await request(app.getHttpServer()) //
				.get(`${basePath}/000000000000000000000000`)
				.expect(404);
		});
	});

	describe('[PATCH] :id', () => {
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should update account', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			const body: AccountByIdBodyParams = {
				password: defaultPassword,
				username: studentAccount.username,
				activated: true,
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/${studentAccount.id}`)
				.send(body)
				.expect(200);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject if user is not authorized', async () => {
			currentUser = mapUserToCurrentUser(studentUser, studentAccount);
			const body: AccountByIdBodyParams = {
				password: defaultPassword,
				username: studentAccount.username,
				activated: true,
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/${studentAccount.id}`)
				.send(body)
				.expect(403);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, studentAccount);
			const body: AccountByIdBodyParams = {
				password: defaultPassword,
				username: studentAccount.username,
				activated: true,
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/000000000000000000000000`)
				.send(body)
				.expect(404);
		});
	});

	describe('[DELETE] :id', () => {
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should delete account', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, studentAccount);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/${studentAccount.id}`)
				.expect(200);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject invalid account id format', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, studentAccount);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/qwerty`)
				.expect(400);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject if user is not a authorized', async () => {
			currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/${studentAccount.id}`)
				.expect(403);
		});
		describe('', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const adminRoles = roleFactory.build({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				});
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

				const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
				const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

				const mapUserToAccount = (user: User): Account =>
					accountFactory.buildWithId({
						userId: user.id,
						username: user.email,
						password: defaultPasswordHash,
					});
				const adminAccount = mapUserToAccount(adminUser);
				const teacherAccount = mapUserToAccount(teacherUser);
				const studentAccount = mapUserToAccount(studentUser);
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist(school);
				em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
				em.persist([adminUser, teacherUser, studentUser, superheroUser]);
				em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { params, loggedInClient, studentAccount };
			};
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, studentAccount);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/000000000000000000000000`)
				.expect(404);
		});
	});
	*/
});
