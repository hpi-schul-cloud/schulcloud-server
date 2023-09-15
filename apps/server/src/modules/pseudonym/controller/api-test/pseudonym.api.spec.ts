import { HttpStatus, INestApplication } from '@nestjs/common';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import {
	cleanupCollections,
	externalToolEntityFactory,
	externalToolPseudonymEntityFactory,
	schoolFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'supertest';
import { School } from '@shared/domain';
import { ServerTestModule } from '../../../server';
import { ExternalToolPseudonymEntity } from '../../entity';
import { ExternalToolEntity } from '../../../tool/external-tool/entity';
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
				const response: Response = await testApiClient.get(`${new ObjectId().toHexString()}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when valid params are given', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school }, []);
				const pseudonymString: string = new ObjectId().toHexString();
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

				const response: Response = await loggedInClient.get(`${pseudonymString}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<PseudonymResponse>(
					expect.objectContaining<Partial<PseudonymResponse>>({
						id: pseudonym.id,
						userId: pseudonym.userId.toString(),
						toolId: pseudonym.toolId.toString(),
					}) as PseudonymResponse
				);
			});
		});

		describe('when pseudonym is not connected to the users school', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const pseudonymString: string = new ObjectId().toHexString();
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

			it('should return an empty pseudonymResponse', async () => {
				const { loggedInClient, pseudonymString } = await setup();

				const response: Response = await loggedInClient.get(`${pseudonymString}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
