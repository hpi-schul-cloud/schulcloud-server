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
	AccountByIdBodyParams,
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

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const mapUserToAccount = (user: User): Account =>
		accountFactory.buildWithId({
			userId: user.id,
			username: user.email,
			password: defaultPasswordHash,
		});

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
		await cleanupCollections(em);
		await app.close();
	});

	describe('[PATCH] me/password', () => {
		describe('When patching with a valid password', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const studentAccount = mapUserToAccount(studentUser);

				em.persist([school, studentRoles, studentUser, studentAccount]);
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

				em.persist([school, studentRoles, studentUser, studentAccount]);
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

				em.persist([school, studentRoles, studentUser, studentAccount]);
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

				em.persist([school, studentRoles, studentUser, studentAccount]);
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
			it('should search for username', async () => {
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

	describe('[GET] :id', () => {
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

				return { loggedInClient, studentAccount };
			};
			it('should return account for account id', async () => {
				const { loggedInClient, studentAccount } = await setup();
				await loggedInClient.get(`/${studentAccount.id}`).expect(200);
			});
		});

		describe('When searching with a not authorized user', () => {
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

				return { loggedInClient, studentAccount };
			};
			it('should reject request', async () => {
				const { loggedInClient, studentAccount } = await setup();
				await loggedInClient.get(`/${studentAccount.id}`).expect(403);
			});
		});

		describe('When searching with a superhero user', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();

				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist([school, superheroRoles, superheroUser, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(superheroAccount);

				return { loggedInClient };
			};

			it('should reject not existing account id', async () => {
				const { loggedInClient } = await setup();
				await loggedInClient.get(`/000000000000000000000000`).expect(404);
			});
		});
	});

	describe('[PATCH] :id', () => {
		describe('When using a superhero user', () => {
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

				const body: AccountByIdBodyParams = {
					password: defaultPassword,
					username: studentAccount.username,
					activated: true,
				};

				return { body, loggedInClient, studentAccount };
			};

			it('should update account', async () => {
				const { body, loggedInClient, studentAccount } = await setup();

				await loggedInClient.patch(`/${studentAccount.id}`, body).expect(200);
			});
		});

		describe('When the user is not authorized', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const studentAccount = mapUserToAccount(studentUser);

				em.persist([school, studentRoles, studentUser, studentAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const body: AccountByIdBodyParams = {
					password: defaultPassword,
					username: studentAccount.username,
					activated: true,
				};

				return { body, loggedInClient, studentAccount };
			};
			it('should reject update request', async () => {
				const { body, loggedInClient, studentAccount } = await setup();

				await loggedInClient.patch(`/${studentAccount.id}`, body).expect(403);
			});
		});

		describe('When updating with a superhero user', () => {
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

				const body: AccountByIdBodyParams = {
					password: defaultPassword,
					username: studentAccount.username,
					activated: true,
				};

				return { body, loggedInClient };
			};
			it('should reject not existing account id', async () => {
				const { body, loggedInClient } = await setup();
				await loggedInClient.patch('/000000000000000000000000', body).expect(404);
			});
		});
	});

	describe('[DELETE] :id', () => {
		describe('When using a superhero user', () => {
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

				return { loggedInClient, studentAccount };
			};
			it('should delete account', async () => {
				const { loggedInClient, studentAccount } = await setup();
				await loggedInClient.delete(`/${studentAccount.id}`).expect(200);
			});
		});

		describe('When using a not authorized (admin) user', () => {
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

				return { loggedInClient, studentAccount };
			};

			it('should reject delete request', async () => {
				const { loggedInClient, studentAccount } = await setup();
				await loggedInClient.delete(`/${studentAccount.id}`).expect(403);
			});
		});

		describe('When using a superhero user', () => {
			const setup = async () => {
				const school = schoolFactory.buildWithId();
				const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });
				const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });
				const superheroAccount = mapUserToAccount(superheroUser);

				em.persist([school, superheroRoles, superheroUser, superheroAccount]);
				await em.flush();

				const loggedInClient = await testApiClient.login(superheroAccount);

				return { loggedInClient };
			};

			it('should reject not existing account id', async () => {
				const { loggedInClient } = await setup();
				await loggedInClient.delete('/000000000000000000000000').expect(404);
			});
		});
	});
});
