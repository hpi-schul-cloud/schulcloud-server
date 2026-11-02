import { faker } from '@faker-js/faker';
import { EntityManager } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { User } from '@modules/user/repo';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { AccountEntity } from '../../repo';
import { type AccountByIdBodyParams, type PatchMyAccountParams, type PatchMyPasswordParams } from '../dto';

describe('Account Controller (API)', () => {
	const basePath = '/account';

	let app: INestApplication;
	let em: EntityManager;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
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
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persist([school, studentUser, studentAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(studentAccount);

				const passwordPatchParams: PatchMyPasswordParams = {
					password: 'Valid12$',
					confirmPassword: 'Valid12$',
				};

				return { passwordPatchParams, loggedInClient, studentAccount };
			};

			it(`should update the current user's (temporary) password`, async () => {
				const { passwordPatchParams, loggedInClient, studentAccount } = await setup();

				await loggedInClient.patch('/me/password', passwordPatchParams).expect(200);

				const updatedAccount = await em.findOneOrFail(AccountEntity, studentAccount.id);
				expect(updatedAccount.password).not.toEqual(defaultPasswordHash);
			});
		});

		describe('When using a weak password', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persist([school, studentUser, studentAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(studentAccount);

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
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persist([school, studentUser, studentAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(studentAccount);

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

				const updatedAccount = await em.findOneOrFail(AccountEntity, studentAccount.id);
				expect(updatedAccount.username).toEqual(newEmailValue);
			});
		});

		describe('When patching with a not valid email', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persist([school, studentUser, studentAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(studentAccount);

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

		describe('When patching with html inside name', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });

				await em.persist([school, teacherUser, teacherAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(teacherAccount);

				const patchMyAccountParams: PatchMyAccountParams = {
					passwordOld: defaultPassword,
					firstName: 'Jane<script>alert("XSS")</script>',
					lastName: '<b>Doe</b>',
				};
				return { patchMyAccountParams, loggedInClient, teacherUser };
			};

			it('should strip HTML off of firstName and lastName', async () => {
				const { teacherUser, loggedInClient, patchMyAccountParams } = await setup();

				await loggedInClient.patch('/me', patchMyAccountParams).expect(200);

				const updatedUser = await em.findOneOrFail(User, teacherUser.id);
				expect(updatedUser.firstName).toEqual('Jane');
				expect(updatedUser.lastName).toEqual('Doe');
			});
		});
	});

	describe('[PATCH] :id', () => {
		describe('When using a superhero user', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({
					school,
					username: faker.internet.email(),
				});
				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({ school: school });

				await em.persist([school, studentUser, superheroUser, studentAccount, superheroAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).asServiceAccount().build(superheroAccount);

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
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persist([school, studentUser, studentAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(studentAccount);

				const body: AccountByIdBodyParams = {
					password: defaultPassword,
					username: studentAccount.username,
					activated: true,
				};

				return { body, loggedInClient, studentAccount };
			};
			it('should reject update request', async () => {
				const { body, loggedInClient, studentAccount } = await setup();

				await loggedInClient.patch(`/${studentAccount.id}`, body).expect(401);
			});
		});

		describe('When updating with a superhero user', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({ school: school });

				await em.persist([school, studentUser, superheroUser, studentAccount, superheroAccount]).flush();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).asServiceAccount().build(superheroAccount);

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
});
