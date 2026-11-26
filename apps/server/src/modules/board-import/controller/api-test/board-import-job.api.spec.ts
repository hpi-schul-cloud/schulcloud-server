import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CoreModule } from '@core/core.module';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import {
	AuthGuardModule,
	AuthGuardOptions,
	JWT_AUTH_GUARD_CONFIG_TOKEN,
	JwtAuthGuardConfig,
	JwtPayloadVo,
} from '@infra/auth-guard';
import {
	BoardsClientAdapter,
	CardClientAdapter,
	type CardControllerCreateElement201Response,
	type CardResponse,
	ColumnClientAdapter,
	type ColumnResponse,
} from '@infra/common-cartridge-clients';
import { ConfigurationModule } from '@infra/configuration';
import { RuntimeConfigService } from '@infra/runtime-config';
import { RuntimeConfigEntity } from '@infra/runtime-config/repo/entity/runtime-config.entity';
import { User } from '@modules/user';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { BoardImportEvents } from '../../amqp';
import { BoardImportApiModule } from '../../board-import-api.module';
import { BoardImportWorkerTestModule } from '../../board-import-worker.app.module';
import {
	BOARD_IMPORT_CONFIG_TOKEN,
	BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN,
	BoardImportConfig,
	type BoardImportPublicApiConfig,
} from '../../board-import.config';
import { API_ENTITIES } from '../../board-import-api.entity.imports';
import { BOARD_IMPORT_SOURCE_SWITCH_KEYS, BoardImportJobStatus, type BoardImportSourceType } from '../../domain';
import { BoardImportRunnerService } from '../../domain/service/board-import-runner.service';
import { BoardImportJobEntity } from '../../repo/entity';
import { type BoardImportJobResponse } from '../dto';
import { boardImportJobEntityFactory, boardImportJobFactory } from '../../testing';

const baseRouteName = 'board-import/jobs';

describe('Board Import Controller (API)', () => {
	let app: INestApplication;
	let jwtConfig: TestJwtModuleConfig;
	let em: EntityManager;
	let amqpConnection: AmqpConnection;
	let config: BoardImportPublicApiConfig;
	let runtimeConfigService: RuntimeConfigService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [
				CoreModule,
				AuthGuardModule.register([
					{
						option: AuthGuardOptions.JWT,
						configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
						configConstructor: JwtAuthGuardConfig,
					},
				]),
				BoardImportApiModule,
				MongoMemoryDatabaseModule.forRoot({ entities: [User, ...API_ENTITIES] }),
				ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig),
			],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
		em = module.get(EntityManager);
		amqpConnection = module.get(AmqpConnection);
		config = module.get(BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN);
		runtimeConfigService = module.get(RuntimeConfigService);
		await amqpConnection.channel.purgeQueue(BoardImportEvents.IMPORT_JOB);
	});

	beforeEach(() => {
		config.featureBoardImportEnabled = true;
	});

	afterEach(async () => {
		await amqpConnection.channel.purgeQueue(BoardImportEvents.IMPORT_JOB);
		await em.nativeDelete(RuntimeConfigEntity, {});
	});

	afterAll(async () => {
		await app.close();
	});

	const setSourceSwitch = async (sourceType: BoardImportSourceType, isEnabled: boolean) => {
		const value = await runtimeConfigService.getByKey(BOARD_IMPORT_SOURCE_SWITCH_KEYS[sourceType]);
		value.setValue(isEnabled);
		await runtimeConfigService.save(value);
		em.clear();
	};

	const setupLoggedInClient = async () => {
		const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
		const loggedInClient = await new TestApiClientBuilder(app, baseRouteName)
			.withJwt(teacherUser, jwtConfig)
			.build(teacherAccount);

		return { loggedInClient, teacherUser };
	};

	describe('[POST] board-import/jobs', () => {
		describe('when the user is not authenticated', () => {
			const setup = () => {
				const { source, target } = boardImportJobFactory.build();
				const { link } = source;
				const body = { link, targetType: target.type, targetId: target.id };

				return { body };
			};

			it('should return status 401', async () => {
				const { body } = setup();

				const response = await new TestApiClientBuilder(app, baseRouteName).build().post('', body);

				expect(response.status).toEqual(401);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { source, target } = boardImportJobFactory.build();
				const { link } = source;
				const body = { link, targetType: target.type, targetId: target.id };
				const jobCount = 0;
				config.featureBoardImportEnabled = false;

				return { loggedInClient, link, body, jobCount };
			};

			it('should return status 403', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(403);
			});

			it('should not store a job', async () => {
				const { loggedInClient, link, body, jobCount } = await setup();

				await loggedInClient.post('', body);

				const count = await em.count(BoardImportJobEntity, { link });
				expect(count).toEqual(jobCount);
			});
		});

		describe('when the link is a TaskCards link and no value of the switch is stored', () => {
			const setup = async () => {
				const { loggedInClient, teacherUser } = await setupLoggedInClient();
				const { source, target } = boardImportJobFactory.build();
				const { link } = source;
				const body = { link, targetType: target.type, targetId: target.id };
				const status = BoardImportJobStatus.WAITING;

				return { loggedInClient, teacherUser, link, source, target, body, status };
			};

			it('should return status 201 with the id and the status of the job', async () => {
				const { loggedInClient, body, status } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(201);
				expect(response.body).toEqual({ id: expect.any(String), status });
			});

			it('should store the job', async () => {
				const { loggedInClient, teacherUser, link, source, target, body, status } = await setup();

				const response = await loggedInClient.post('', body);

				const { id } = response.body as BoardImportJobResponse;
				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(entity).toMatchObject({
					link,
					sourceType: source.type,
					targetType: target.type,
					targetId: new ObjectId(target.id),
					status,
					userId: new ObjectId(teacherUser.id),
					expiresAt: expect.any(Date),
				});
			});

			it('should send the id of the job to the import job queue', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				const { id } = response.body as BoardImportJobResponse;
				const message = await amqpConnection.channel.get(BoardImportEvents.IMPORT_JOB, { noAck: true });
				expect(message && JSON.parse(message.content.toString())).toEqual({ jobId: id });
			});
		});

		describe.each([
			{ name: 'has an IP address as host', link: 'https://127.0.0.1/board', type: 'BOARD_IMPORT_LINK_INVALID' },
			{ name: 'has a port', link: 'https://www.taskcards.de:8443/board', type: 'BOARD_IMPORT_LINK_INVALID' },
			{
				name: 'does not point to a known source',
				link: 'https://example.com/board',
				type: 'BOARD_IMPORT_SOURCE_UNKNOWN',
			},
		])('when the link $name', ({ link, type }) => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = boardImportJobFactory.build();
				const body = { link, targetType: target.type, targetId: target.id };

				return { loggedInClient, body };
			};

			it('should return status 400 with the type of the error', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
				expect(response.body).toEqual(expect.objectContaining({ type }));
			});

			it('should not show the link in the response', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.text).not.toContain(link);
			});

			it('should not store a job', async () => {
				const { loggedInClient, body } = await setup();

				await loggedInClient.post('', body);

				const count = await em.count(BoardImportJobEntity, { link });
				expect(count).toEqual(0);
			});

			it('should not send a message to the import job queue', async () => {
				const { loggedInClient, body } = await setup();

				await loggedInClient.post('', body);

				const message = await amqpConnection.channel.get(BoardImportEvents.IMPORT_JOB, { noAck: true });
				expect(message).toBe(false);
			});
		});

		describe('when the source is switched off', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { source, target } = boardImportJobFactory.build();
				const { link } = source;
				const body = { link, targetType: target.type, targetId: target.id };
				const type = 'BOARD_IMPORT_SOURCE_DISABLED';
				await setSourceSwitch(source.type, false);

				return { loggedInClient, link, body, type };
			};

			it('should return status 403 with the type of the error', async () => {
				const { loggedInClient, body, type } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(403);
				expect(response.body).toEqual(expect.objectContaining({ type }));
			});

			it('should not store a job', async () => {
				const { loggedInClient, link, body } = await setup();

				await loggedInClient.post('', body);

				const count = await em.count(BoardImportJobEntity, { link });
				expect(count).toEqual(0);
			});

			it('should not send a message to the import job queue', async () => {
				const { loggedInClient, body } = await setup();

				await loggedInClient.post('', body);

				const message = await amqpConnection.channel.get(BoardImportEvents.IMPORT_JOB, { noAck: true });
				expect(message).toBe(false);
			});
		});

		describe('when the source is switched on again', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { source, target } = boardImportJobFactory.build();
				const body = { link: source.link, targetType: target.type, targetId: target.id };
				await setSourceSwitch(source.type, false);
				await setSourceSwitch(source.type, true);

				return { loggedInClient, body };
			};

			it('should return status 201', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(201);
			});
		});

		describe('when the switches of all sources are read', () => {
			const setup = () => {
				const switchKeys = Object.values(BOARD_IMPORT_SOURCE_SWITCH_KEYS);

				return { switchKeys };
			};

			it('should find a boolean key in the runtime config for each source', async () => {
				const { switchKeys } = setup();

				const values = await Promise.all(switchKeys.map((key) => runtimeConfigService.getBoolean(key)));

				expect(values.map((value) => typeof value)).toEqual(switchKeys.map(() => 'boolean'));
			});
		});

		describe('when the link has no https scheme', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = boardImportJobFactory.build();
				const link = 'http://example.com/board';
				const body = { link, targetType: target.type, targetId: target.id };

				return { loggedInClient, body };
			};

			it('should return status 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
			});
		});

		describe('when the link has no scheme', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = boardImportJobFactory.build();
				const link = 'example.com/board';
				const body = { link, targetType: target.type, targetId: target.id };

				return { loggedInClient, body };
			};

			it('should return status 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
			});
		});

		describe('when the link contains credentials', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = boardImportJobFactory.build();
				const link = 'https://user:password@example.com/board';
				const body = { link, targetType: target.type, targetId: target.id };

				return { loggedInClient, body };
			};

			it('should return status 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
			});
		});

		describe('when the link is missing', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = boardImportJobFactory.build();
				const body = { targetType: target.type, targetId: target.id };

				return { loggedInClient, body };
			};

			it('should return status 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
			});
		});

		describe('when the target type is not valid', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { source, target } = boardImportJobFactory.build();
				const { link } = source;
				const body = { link, targetType: 'user', targetId: target.id };

				return { loggedInClient, body };
			};

			it('should return status 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
			});
		});

		describe('when the target id is not a valid id', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { source, target } = boardImportJobFactory.build();
				const { link } = source;
				const body = { link, targetType: target.type, targetId: 'invalid-id' };

				return { loggedInClient, body };
			};

			it('should return status 400', async () => {
				const { loggedInClient, body } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
			});
		});
	});

	describe('[GET] board-import/jobs/:jobId', () => {
		describe('when the user is not authenticated', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();

				return { id };
			};

			it('should return status 401', async () => {
				const { id } = setup();

				const response = await new TestApiClientBuilder(app, baseRouteName).build().get(id);

				expect(response.status).toEqual(401);
			});
		});

		describe('when the user started the job', () => {
			const setup = async () => {
				const { loggedInClient, teacherUser } = await setupLoggedInClient();
				const entity = boardImportJobEntityFactory.build({ userId: new ObjectId(teacherUser.id) });
				await em.persist(entity).flush();
				em.clear();

				return { loggedInClient, entity };
			};

			it('should return status 200 with the id and the status of the job', async () => {
				const { loggedInClient, entity } = await setup();

				const response = await loggedInClient.get(entity.id);

				expect(response.status).toEqual(200);
				expect(response.body).toEqual({ id: entity.id, status: entity.status });
			});
		});

		describe('when another user started the job', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				em.clear();

				return { loggedInClient, entity };
			};

			it('should return status 404', async () => {
				const { loggedInClient, entity } = await setup();

				const response = await loggedInClient.get(entity.id);

				expect(response.status).toEqual(404);
			});
		});

		describe('when the job does not exist', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { id } = boardImportJobFactory.build();

				return { loggedInClient, id };
			};

			it('should return status 404', async () => {
				const { loggedInClient, id } = await setup();

				const response = await loggedInClient.get(id);

				expect(response.status).toEqual(404);
			});
		});

		describe('when the job id is not a valid id', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const jobId = 'invalid-id';

				return { loggedInClient, jobId };
			};

			it('should return status 400', async () => {
				const { loggedInClient, jobId } = await setup();

				const response = await loggedInClient.get(jobId);

				expect(response.status).toEqual(400);
			});
		});
	});
});

const publishJob = async (amqpConnection: AmqpConnection, jobId: string): Promise<void> => {
	await amqpConnection.publish('board-import', BoardImportEvents.IMPORT_JOB, { jobId });
};

const waitForStatus = async (
	em: EntityManager,
	id: string,
	status: BoardImportJobStatus
): Promise<BoardImportJobEntity> => {
	for (let i = 0; i < 100; i += 1) {
		const entity = await em.fork().findOneOrFail(BoardImportJobEntity, { id });
		if (entity.status === status) {
			return entity;
		}
		await new Promise((resolve) => {
			setTimeout(resolve, 50);
		});
	}

	throw new Error(`The job did not get the status ${status}`);
};

// The worker tests are in this file, because all tests use the same queue and must not run at the same time.
describe('Board Import Worker (queue)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let amqpConnection: AmqpConnection;
	let runner: DeepMocked<BoardImportRunnerService>;
	let config: BoardImportConfig;

	beforeAll(async () => {
		config = new BoardImportConfig();
		config.jobRetryDelayInSeconds = 0;

		const module = await Test.createTestingModule({
			imports: [BoardImportWorkerTestModule],
		})
			.overrideProvider(BOARD_IMPORT_CONFIG_TOKEN)
			.useValue(config)
			.overrideProvider(BoardImportRunnerService)
			.useValue(createMock<BoardImportRunnerService>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		amqpConnection = module.get(AmqpConnection);
		runner = module.get(BoardImportRunnerService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await amqpConnection.channel.purgeQueue(BoardImportEvents.IMPORT_JOB);
		await app.close();
	});

	const setupQueuedJob = async () => {
		const entity = boardImportJobEntityFactory.build();
		await em.persist(entity).flush();
		em.clear();

		const publishQueuedJob = (): Promise<void> => publishJob(amqpConnection, entity.id);

		return { id: entity.id, publishJob: publishQueuedJob };
	};

	describe('when a job is in the queue', () => {
		const setup = async () => {
			const { id, publishJob } = await setupQueuedJob();
			let finishImport = (): void => {};

			const attempts = 1;

			runner.run.mockReturnValueOnce(
				new Promise<void>((resolve) => {
					finishImport = resolve;
				})
			);

			return { id, publishJob, finishImport: () => finishImport(), attempts };
		};

		it('should set the job to running while the import runs and to finished after it', async () => {
			const { id, publishJob, finishImport, attempts } = await setup();

			await publishJob();

			const runningJob = await waitForStatus(em, id, BoardImportJobStatus.RUNNING);
			expect(runningJob.attempts).toEqual(attempts);
			expect(runningJob.startedAt).toEqual(expect.any(Date));

			finishImport();

			const finishedJob = await waitForStatus(em, id, BoardImportJobStatus.FINISHED);
			expect(finishedJob.attempts).toEqual(attempts);
		});
	});

	describe('when the import fails on each delivery', () => {
		const setup = async () => {
			const { id, publishJob } = await setupQueuedJob();
			const maxAttempts = config.jobMaxAttempts;

			for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
				runner.run.mockRejectedValueOnce(new Error('import failed'));
			}

			return { id, publishJob, maxAttempts };
		};

		it('should process the job again until the maximum number of attempts and then set it to failed', async () => {
			const { id, publishJob, maxAttempts } = await setup();

			await publishJob();

			const failedJob = await waitForStatus(em, id, BoardImportJobStatus.FAILED);
			expect(failedJob.attempts).toEqual(maxAttempts);
			expect(runner.run).toHaveBeenCalledTimes(maxAttempts);
		});
	});

	describe('when the import fails on the first delivery only', () => {
		const setup = async () => {
			const { id, publishJob } = await setupQueuedJob();

			const attempts = 2;

			runner.run.mockRejectedValueOnce(new Error('import failed'));
			runner.run.mockResolvedValueOnce();

			return { id, publishJob, attempts };
		};

		it('should finish the job on the second attempt', async () => {
			const { id, publishJob, attempts } = await setup();

			await publishJob();

			const finishedJob = await waitForStatus(em, id, BoardImportJobStatus.FINISHED);
			expect(finishedJob.attempts).toEqual(attempts);
		});
	});
});

describe('Board Import Worker (import as the user)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let amqpConnection: AmqpConnection;
	let boardsClient: DeepMocked<BoardsClientAdapter>;
	let columnClient: DeepMocked<ColumnClientAdapter>;
	let cardClient: DeepMocked<CardClientAdapter>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [BoardImportWorkerTestModule],
		})
			.overrideProvider(BoardsClientAdapter)
			.useValue(createMock<BoardsClientAdapter>())
			.overrideProvider(ColumnClientAdapter)
			.useValue(createMock<ColumnClientAdapter>())
			.overrideProvider(CardClientAdapter)
			.useValue(createMock<CardClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		amqpConnection = module.get(AmqpConnection);
		boardsClient = module.get(BoardsClientAdapter);
		columnClient = module.get(ColumnClientAdapter);
		cardClient = module.get(CardClientAdapter);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await amqpConnection.channel.purgeQueue(BoardImportEvents.IMPORT_JOB);
		await app.close();
	});

	describe('when the job of a user with an account is in the queue', () => {
		const setup = async () => {
			const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
			const entity = boardImportJobEntityFactory.build({ userId: new ObjectId(teacherUser.id) });
			await em.persist([teacherUser, teacherAccount, entity]).flush();
			em.clear();

			const boardId = new ObjectId().toHexString();
			const expectedClaims = {
				userId: teacherUser.id,
				accountId: teacherAccount.id,
				support: false,
				isServiceAccount: false,
			};

			boardsClient.createBoard.mockResolvedValueOnce({ id: boardId });
			boardsClient.createBoardColumn.mockResolvedValueOnce(
				createMock<ColumnResponse>({ id: new ObjectId().toHexString(), cards: [] })
			);
			columnClient.createCard.mockResolvedValueOnce(
				createMock<CardResponse>({ id: new ObjectId().toHexString(), elements: [] })
			);
			cardClient.createCardElement.mockResolvedValueOnce(
				createMock<CardControllerCreateElement201Response>({ id: new ObjectId().toHexString() })
			);
			cardClient.updateCardElement.mockResolvedValueOnce(createMock());

			return { id: entity.id, boardId, expectedClaims };
		};

		it('should create the board with a token of the user and store the board in the job', async () => {
			const { id, boardId, expectedClaims } = await setup();

			await publishJob(amqpConnection, id);

			const finishedJob = await waitForStatus(em, id, BoardImportJobStatus.FINISHED);
			const token = boardsClient.createBoard.mock.calls[0][0];
			const claims = JwtPayloadVo.fromJwtToken(token);
			expect(claims).toMatchObject(expectedClaims);
			expect(finishedJob.boardId?.toHexString()).toEqual(boardId);
		});
	});

	describe('when the user of the job does not exist', () => {
		const setup = async () => {
			const entity = boardImportJobEntityFactory.build();
			await em.persist(entity).flush();
			em.clear();

			const attempts = 1;

			return { id: entity.id, attempts };
		};

		it('should set the job to failed on the first attempt and create no board', async () => {
			const { id, attempts } = await setup();

			await publishJob(amqpConnection, id);

			const failedJob = await waitForStatus(em, id, BoardImportJobStatus.FAILED);
			expect(failedJob.attempts).toEqual(attempts);
			expect(boardsClient.createBoard).not.toHaveBeenCalled();
		});
	});
});
