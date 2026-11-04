import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { UUID } from 'bson';
import { type Server } from 'node:http';
import supertest, { type Response } from 'supertest';
import { type ExternalToolPseudonymEntity } from '../../entity';
import { externalToolPseudonymEntityFactory } from '../../testing';
import { type PseudonymResponse } from '../dto';
const baseRouteName = 'pseudonyms';
describe('PseudonymController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[GET] pseudonyms/:pseudonym', () => {
		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const response: Response = await new TestApiClientBuilder(app, baseRouteName)
					.build()
					.get(new ObjectId().toHexString());

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when valid params are given', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school }, []);
				const pseudonymString: string = new UUID().toString();
				const externalToolEntity = externalToolEntityFactory.buildWithId();
				const pseudonym: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					pseudonym: pseudonymString,
					toolId: externalToolEntity.id,
					userId: studentUser.id,
				});

				await em.persist([studentAccount, studentUser, pseudonym, externalToolEntity, school]).flush();
				em.clear();

				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(studentAccount);

				return { loggedInClient, pseudonym, pseudonymString };
			};

			it('should return a pseudonymResponse', async () => {
				const { loggedInClient, pseudonymString, pseudonym } = await setup();

				const response: Response = await loggedInClient.get(pseudonymString);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<PseudonymResponse>({
					id: pseudonym.id,
					userId: pseudonym.userId.toString(),
					toolId: pseudonym.toolId.toString(),
				});
			});
		});

		describe('when pseudonym is not connected to the users school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });
				const pseudonymString: string = new UUID().toString();
				const externalToolEntity = externalToolEntityFactory.buildWithId();
				const pseudonym: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					pseudonym: pseudonymString,
					toolId: externalToolEntity.id,
					userId: teacherUser.id,
				});

				await em
					.persist([studentAccount, studentUser, teacherUser, teacherAccount, pseudonym, externalToolEntity, school])
					.flush();
				em.clear();

				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(studentAccount);

				return { loggedInClient, pseudonymString };
			};

			it('should return forbidden', async () => {
				const { loggedInClient, pseudonymString } = await setup();

				const response: Response = await loggedInClient.get(pseudonymString);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when pseudonym does not exist in db', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const pseudonymString: string = new UUID().toString();
				const externalToolEntity = externalToolEntityFactory.buildWithId();
				const pseudonym: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					pseudonym: new UUID().toString(),
					toolId: externalToolEntity.id,
					userId: studentUser.id,
				});

				await em.persist([studentAccount, studentUser, pseudonym, externalToolEntity, school]).flush();
				em.clear();

				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(studentAccount);

				return { loggedInClient, pseudonymString };
			};

			it('should return not found', async () => {
				const { loggedInClient, pseudonymString } = await setup();

				const response: Response = await loggedInClient.get(pseudonymString);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('[GET] pseudonyms/username/:pseudonym', () => {
		it('shows a storage-access prompt without a JWT', async () => {
			const response = await supertest(app.getHttpServer() as Server).get('/pseudonyms/username/opaque-pseudonym');

			expect(response.status).toBe(HttpStatus.OK);
			expect(response.headers['content-type']).toContain('text/html');
			expect(response.text).toContain('Namen zeigen');
			expect(response.text).toContain('document.requestStorageAccess()');
		});

		it('returns 401 for an invalid JWT instead of displaying a name', async () => {
			const response = await supertest(app.getHttpServer() as Server)
				.get('/pseudonyms/username/opaque-pseudonym')
				.set('Cookie', 'jwt=invalid');

			expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
		});

		it('renders an authorized user name as escaped HTML', async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });
			const { studentUser } = UserAndAccountTestFactory.buildStudent({
				school,
				firstName: '<Ada>',
				lastName: 'Lovelace',
			});
			const externalTool = externalToolEntityFactory.buildWithId();
			const pseudonym = externalToolPseudonymEntityFactory.buildWithId({
				pseudonym: new UUID().toString(),
				toolId: externalTool.id,
				userId: studentUser.id,
			});
			await em.persist([school, teacherUser, teacherAccount, studentUser, externalTool, pseudonym]).flush();
			em.clear();

			const client = await new TestApiClientBuilder(app, 'pseudonyms/username').build(teacherAccount);
			const response = await client.get(pseudonym.pseudonym);

			expect(response.status).toBe(HttpStatus.OK);
			expect(response.text).toContain('&lt;Ada&gt; Lovelace');
			expect(response.text).not.toContain('document.requestStorageAccess()');
			expect(response.headers['cache-control']).toBe('no-store');
		});
	});
});
