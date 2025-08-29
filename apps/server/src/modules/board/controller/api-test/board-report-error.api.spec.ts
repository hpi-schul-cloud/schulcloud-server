import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { schoolEntityFactory } from '@modules/school/testing';
import { userFactory } from '@modules/user/testing';
import { accountFactory } from '@modules/account/testing';
import { BoardErrorReportBodyParams } from '../dto/board/board-error-report.body.params';

const baseRouteName = '/report-board-error';

describe('BoardErrorReportController (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	const validPayload: BoardErrorReportBodyParams = {
		type: 'disconnect',
		message: 'Websocket failed to connect',
		url: 'https://example.com/board',
		boardId: 'boardId',
		retryCount: 0,
	};

	const setup = async (): Promise<{ loggedInClient: TestApiClient }> => {
		const school = schoolEntityFactory.buildWithId();
		const user = userFactory.buildWithId({ school });
		const account = accountFactory.withUser(user).build();

		await em.persistAndFlush([school, user, account]);
		em.clear();

		const loggedInClient = await testApiClient.login(account);

		return { loggedInClient };
	};

	describe('When request is valid', () => {
		it('should return status 201', async () => {
			const { loggedInClient } = await setup();

			const payload: BoardErrorReportBodyParams = { ...validPayload };
			const response = await loggedInClient.post(undefined, payload);

			expect(response.status).toEqual(201);
		});
	});

	describe('When user is unauthorized', () => {
		it('should return status 401', async () => {
			const response = await testApiClient.post(undefined, validPayload);

			expect(response.status).toEqual(401);
		});
	});

	describe('When error type is missing', () => {
		it('should return status 400', async () => {
			const { loggedInClient } = await setup();

			const payload: Partial<BoardErrorReportBodyParams> = { ...validPayload };
			delete payload.type;

			const response = await loggedInClient.post(undefined, payload);

			expect(response.status).toEqual(400);
		});
	});
});
