import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import {
	cleanupCollections,
	externalToolPseudonymEntityFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { UUID } from 'bson';
import { Response } from 'supertest';
import { ExternalToolPseudonymEntity } from '../../entity';
import { PseudonymResponse } from '../dto';

describe('PseudonymController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'pseudonyms');
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
				const response: Response = await testApiClient.get(new ObjectId().toHexString());

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when valid params are given', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school }, []);
				const pseudonymString: string = new UUID().toString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();
				const pseudonym: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					pseudonym: pseudonymString,
					toolId: externalToolEntity.id,
					userId: studentUser.id,
				});

				await em.persistAndFlush([studentAccount, studentUser, pseudonym, externalToolEntity, school]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

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
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });
				const pseudonymString: string = new UUID().toString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();
				const pseudonym: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					pseudonym: pseudonymString,
					toolId: externalToolEntity.id,
					userId: teacherUser.id,
				});

				await em.persistAndFlush([
					studentAccount,
					studentUser,
					teacherUser,
					teacherAccount,
					pseudonym,
					externalToolEntity,
					school,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

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
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const pseudonymString: string = new UUID().toString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();
				const pseudonym: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.buildWithId({
					pseudonym: new UUID().toString(),
					toolId: externalToolEntity.id,
					userId: studentUser.id,
				});

				await em.persistAndFlush([studentAccount, studentUser, pseudonym, externalToolEntity, school]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

				return { loggedInClient, pseudonymString };
			};

			it('should return not found', async () => {
				const { loggedInClient, pseudonymString } = await setup();

				const response: Response = await loggedInClient.get(pseudonymString);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});
});
