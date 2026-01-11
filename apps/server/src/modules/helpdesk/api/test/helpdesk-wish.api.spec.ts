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
import { HelpdeskWishCreateParamsFactory } from '../../testing/helpdesk-wish-create-params.test.factory';

describe('Helpdesk Wish Endpoint (API)', () => {
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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

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

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, validBody };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody } = await setup();

				const response = await loggedInClient.post('wish', validBody);

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe('when file size exceeds maximum', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				// Create a file larger than 5 MB (5000 * 1024 bytes)
				const largeFile = Buffer.alloc(5001 * 1024);

				return { loggedInClient, validBody, largeFile };
			};

			it('should return 400', async () => {
				const { loggedInClient, validBody, largeFile } = await setup();

				let request = loggedInClient
					.post('wish')
					.field('supportType', validBody.supportType)
					.field('subject', validBody.subject)
					.field('replyEmail', validBody.replyEmail)
					.field('role', validBody.role)
					.field('desire', validBody.desire)
					.field('benefit', validBody.benefit);

				for (const area of validBody.problemArea) {
					request = request.field('problemArea', area);
				}

				const response = await request.attach('files', largeFile, 'large.jpg');

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when file type is invalid', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				// Create a file with invalid mime type
				const invalidFile = Buffer.from('test content');

				return { loggedInClient, validBody, invalidFile };
			};

			it('should return 400', async () => {
				const { loggedInClient, validBody, invalidFile } = await setup();

				let request = loggedInClient
					.post('wish')
					.field('supportType', validBody.supportType)
					.field('subject', validBody.subject)
					.field('replyEmail', validBody.replyEmail)
					.field('role', validBody.role)
					.field('desire', validBody.desire)
					.field('benefit', validBody.benefit);

				for (const area of validBody.problemArea) {
					request = request.field('problemArea', area);
				}

				const response = await request.attach('files', invalidFile, {
					filename: 'invalid.txt',
					contentType: 'text/plain',
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when file type is image/jpeg', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const validFile = Buffer.from('valid image content');

				return { loggedInClient, validBody, validFile };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody, validFile } = await setup();

				let request = loggedInClient
					.post('wish')
					.field('supportType', validBody.supportType)
					.field('subject', validBody.subject)
					.field('replyEmail', validBody.replyEmail)
					.field('role', validBody.role)
					.field('desire', validBody.desire)
					.field('benefit', validBody.benefit);

				for (const area of validBody.problemArea) {
					request = request.field('problemArea', area);
				}

				const response = await request.attach('files', validFile, {
					filename: 'valid.jpg',
					contentType: 'image/jpeg',
				});

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe('when file type is image/png', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const validFile = Buffer.from('valid png content');

				return { loggedInClient, validBody, validFile };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody, validFile } = await setup();

				let request = loggedInClient
					.post('wish')
					.field('supportType', validBody.supportType)
					.field('subject', validBody.subject)
					.field('replyEmail', validBody.replyEmail)
					.field('role', validBody.role)
					.field('desire', validBody.desire)
					.field('benefit', validBody.benefit);

				for (const area of validBody.problemArea) {
					request = request.field('problemArea', area);
				}

				const response = await request.attach('files', validFile, {
					filename: 'valid.png',
					contentType: 'image/png',
				});

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe('when file type is video/mp4', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const validFile = Buffer.from('valid mp4 content');

				return { loggedInClient, validBody, validFile };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody, validFile } = await setup();

				let request = loggedInClient
					.post('wish')
					.field('supportType', validBody.supportType)
					.field('subject', validBody.subject)
					.field('replyEmail', validBody.replyEmail)
					.field('role', validBody.role)
					.field('desire', validBody.desire)
					.field('benefit', validBody.benefit);

				for (const area of validBody.problemArea) {
					request = request.field('problemArea', area);
				}

				const response = await request.attach('files', validFile, {
					filename: 'valid.mp4',
					contentType: 'video/mp4',
				});

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe('when file type is application/pdf', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const validFile = Buffer.from('valid pdf content');

				return { loggedInClient, validBody, validFile };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody, validFile } = await setup();

				let request = loggedInClient
					.post('wish')
					.field('supportType', validBody.supportType)
					.field('subject', validBody.subject)
					.field('replyEmail', validBody.replyEmail)
					.field('role', validBody.role)
					.field('desire', validBody.desire)
					.field('benefit', validBody.benefit);

				for (const area of validBody.problemArea) {
					request = request.field('problemArea', area);
				}

				const response = await request.attach('files', validFile, {
					filename: 'valid.pdf',
					contentType: 'application/pdf',
				});

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe('when file type is application/vnd.openxmlformats-officedocument.wordprocessingml.document', () => {
			const setup = async () => {
				const validBody = HelpdeskWishCreateParamsFactory.create();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await testApiClient.login(studentAccount);

				const validFile = Buffer.from('valid docx content');

				return { loggedInClient, validBody, validFile };
			};

			it('should return 201', async () => {
				const { loggedInClient, validBody, validFile } = await setup();

				let request = loggedInClient
					.post('wish')
					.field('supportType', validBody.supportType)
					.field('subject', validBody.subject)
					.field('replyEmail', validBody.replyEmail)
					.field('role', validBody.role)
					.field('desire', validBody.desire)
					.field('benefit', validBody.benefit);

				for (const area of validBody.problemArea) {
					request = request.field('problemArea', area);
				}

				const response = await request.attach('files', validFile, {
					filename: 'valid.docx',
					contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				});

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});
	});
});
