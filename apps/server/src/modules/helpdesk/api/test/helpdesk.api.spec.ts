import { EntityManager } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { SupportType } from '../../domain';
import { HelpdeskProblemCreateParamsFactory } from '../../testing/helpdesk-problem-create-params.test.factory';
import { HelpdeskWishCreateParamsFactory } from '../../testing/helpdesk-wish-create-params.test.factory';

describe('Helpdesk Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		await app.init();
		em = app.get(EntityManager);

		testApiClient = new TestApiClient(app, 'helpdesk');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /helpdesk/problem', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const validBody = HelpdeskProblemCreateParamsFactory.create();

				const response = await testApiClient.post('problem', validBody);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user lacks HELPDESK_CREATE permission', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
				const studentAccount = accountFactory.buildWithId({
					userId: studentUser.id,
					username: studentUser.email,
				});

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);
				const validBody = HelpdeskProblemCreateParamsFactory.create();

				return { loggedInClient, validBody };
			};

			it('should return 403', async () => {
				const { loggedInClient, validBody } = await setup();

				const response = await loggedInClient.post('problem', validBody);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when subject is missing', () => {
			const setup = async () => {
				const body = HelpdeskProblemCreateParamsFactory.create({ subject: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('problem', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when replyEmail is missing', () => {
			const setup = async () => {
				const body = HelpdeskProblemCreateParamsFactory.create({ replyEmail: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('problem', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when problemArea is missing', () => {
			const setup = async () => {
				const body = HelpdeskProblemCreateParamsFactory.create({ problemArea: undefined as unknown as string[] });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('problem', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when problemDescription is missing', () => {
			const setup = async () => {
				const body = HelpdeskProblemCreateParamsFactory.create({ problemDescription: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('problem', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when body is valid', () => {
			const setup = async () => {
				const validBody = HelpdeskProblemCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, validBody };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody } = await setup();

				const response = await loggedInClient.post('problem', validBody);

				expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(response.status);
			});
		});
	});

	describe('POST /helpdesk/wish', () => {
		describe('when user lacks HELPDESK_CREATE permission', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

				const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });

				const studentAccount = accountFactory.buildWithId({
					userId: studentUser.id,
					username: studentUser.email,
				});

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);
				const validBody = HelpdeskWishCreateParamsFactory.create();

				return { loggedInClient, validBody };
			};

			it('should return 403', async () => {
				const { loggedInClient, validBody } = await setup();

				const response = await loggedInClient.post('wish', validBody);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();

				const response = await testApiClient.post('wish', validBody);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when subject is missing', () => {
			const setup = async () => {
				const body = HelpdeskWishCreateParamsFactory.create({ subject: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('wish', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when replyEmail is missing', () => {
			const setup = async () => {
				const body = HelpdeskWishCreateParamsFactory.create({ replyEmail: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('wish', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when problemArea is missing', () => {
			const setup = async () => {
				const body = HelpdeskWishCreateParamsFactory.create({ problemArea: undefined as unknown as string[] });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('wish', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when role is missing', () => {
			const setup = async () => {
				const body = HelpdeskWishCreateParamsFactory.create({ role: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('wish', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when desire is missing', () => {
			const setup = async () => {
				const body = HelpdeskWishCreateParamsFactory.create({ desire: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('wish', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when benefit is missing', () => {
			const setup = async () => {
				const body = HelpdeskWishCreateParamsFactory.create({ benefit: undefined as unknown as string });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('wish', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when support type is invalid', () => {
			const setup = async () => {
				const body = HelpdeskWishCreateParamsFactory.create({ supportType: 'invalid' as SupportType });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, body };
			};

			it('should return 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('wish', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toHaveProperty('validationErrors');
			});
		});

		describe('when body is valid', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, validBody };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody } = await setup();

				const response = await loggedInClient.post('wish', validBody);

				expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(response.status);
			});
		});
	});
});
