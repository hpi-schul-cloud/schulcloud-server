import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { schoolEntityFactory } from '@modules/school/testing';
import { userFactory } from '@modules/user/testing';
import { accountFactory } from '@modules/account/testing';
import { SchoolEntity } from '@modules/school/repo';
import { BoardErrorContextTypeEnum } from '@modules/board/interface/board-error-context-type.enum';
import { BoardErrorTypeEnum } from '@modules/board/interface/board-error-type.enum';
import { BoardErrorReportBodyParams } from '../dto/board/board-error-report.body.params';

const baseRouteName = '/boards-error-report';

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

	const setupValidUser = async (): Promise<{
		loggedInClient: TestApiClient;
		school: SchoolEntity;
	}> => {
		const school = schoolEntityFactory.buildWithId();
		const user = userFactory.buildWithId({ school });
		const account = accountFactory.withUser(user).build();

		await em.persistAndFlush([school, user, account]);
		em.clear();

		const loggedInClient: TestApiClient = await testApiClient.login(account);
		return { loggedInClient, school };
	};

	// const setupForbiddenUser = async () => {
	// 	return { loggedInClient: testApiClient };
	// };

	const validPayload: BoardErrorReportBodyParams = {
		errorType: BoardErrorTypeEnum.WEBSOCKET_UNABLE_TO_CONNECT,
		pageUrl: 'https://example.com/board',
		contextType: BoardErrorContextTypeEnum.BOARD,
		contextId: 'boardId',
		schoolId: 'schoolId',
		userId: 'userId',
		errorMessage: 'Websocket failed to connect',
		timestamp: '2023-10-01T12:00:00Z',
	};

	describe('When reporting a websocket error', () => {
		describe('When request is valid', () => {
			it('should return status 201', async () => {
				const { loggedInClient } = await setupValidUser();

				const validPayload: BoardErrorReportBodyParams = {
					errorType: BoardErrorTypeEnum.WEBSOCKET_UNABLE_TO_CONNECT,
					pageUrl: 'https://example.com/board',
					contextType: BoardErrorContextTypeEnum.BOARD,
					contextId: 'boardId',
					schoolId: 'schoolId',
					userId: 'userId',
					errorMessage: 'Websocket failed to connect',
					timestamp: '2023-10-01T12:00:00Z',
				};
				console.log('validPayload', validPayload);
				const response = await loggedInClient.post(undefined, validPayload);

				expect(response.status).toEqual(201);
			});
		});

		describe('When request is invalid', () => {
			it('should return status 400', async () => {
				const { loggedInClient } = await setupValidUser();

				const invalidPayload = { ...validPayload, errorType: undefined };
				const response = await loggedInClient.post(undefined, invalidPayload);

				expect(response.status).toEqual(400);
			});
		});
	});

	// describe('When user is unauthorized', () => {
	// 	it('should return status 401');
	// });

	// describe('When user is forbidden', () => {
	// 	it('should return status 403');
	// });

	// describe('When body data is incorrect', () => {
	// 	describe('When errorType is missing', () => {
	// 		it('should return status 400');
	// 	});

	// 	describe('When pageUrl is missing', () => {
	// 		it('should return status 400');
	// 	});

	// 	describe('When contextType is invalid', () => {
	// 		it('should return status 400');
	// 	});

	// 	describe('When contextId is missing', () => {
	// 		it('should return status 400');
	// 	});

	// 	describe('When schoolId is missing', () => {
	// 		it('should return status 400');
	// 	});

	// 	describe('When userId is missing', () => {
	// 		it('should return status 400');
	// 	});

	// 	describe('errorType property', () => {
	// 		describe('When errorType is missing', () => {
	// 			it('should return status 400');
	// 		});
	// 		describe('When errorType is an invalid enum value', () => {
	// 			it('should return status 400');
	// 		});
	// 	});

	// 	describe('pageUrl property', () => {
	// 		describe('When pageUrl is missing', () => {
	// 			it('should return status 400');
	// 		});
	// 	});

	// 	describe('contextType property', () => {
	// 		describe('When contextType is invalid', () => {
	// 			it('should return status 400');
	// 		});
	// 		describe('When contextType is an invalid enum value', () => {
	// 			it('should return status 400');
	// 		});
	// 	});

	// 	describe('contextId property', () => {
	// 		describe('When contextId is missing', () => {
	// 			it('should return status 400');
	// 		});
	// 	});

	// 	describe('schoolId property', () => {
	// 		describe('When schoolId is missing', () => {
	// 			it('should return status 400');
	// 		});
	// 	});

	// 	describe('userId property', () => {
	// 		describe('When userId is missing', () => {
	// 			it('should return status 400');
	// 		});
	// 	});

	// 	describe('errorMessage property', () => {
	// 		describe('When errorMessage is empty', () => {
	// 			it('should return status 400');
	// 		});
	// 	});

	// 	describe('timestamp property', () => {
	// 		describe('When timestamp is missing or invalid', () => {
	// 			it('should return status 400');
	// 		});
	// 	});
	// });
});
