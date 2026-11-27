import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { JwtPayloadVo } from '@infra/auth-guard';
import {
	BoardsClientAdapter,
	CardClientAdapter,
	type CardResponse,
	ColumnClientAdapter,
	type ColumnResponse,
	ContentElementType,
	FilesStorageClientAdapter,
	MetaDataEntityType,
	MetaTagsClientAdapter,
} from '@infra/common-cartridge-clients';
import { ConfigurationModule } from '@infra/configuration';
import { RuntimeConfigService } from '@infra/runtime-config';
import { RuntimeConfigEntity } from '@infra/runtime-config/repo/entity/runtime-config.entity';
import { BOARD_IMPORT_TASKCARDS_SOURCE_TYPE } from '@modules/board-import-taskcards';
import { readTaskcardsFixture } from '@modules/board-import-taskcards/testing';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { BoardImportEvents } from '../../amqp';
import { BoardImportApiTestModule } from '../../board-import-api.app.module';
import { BoardImportWorkerTestModule } from '../../board-import-worker.app.module';
import {
	BOARD_IMPORT_CONFIG_TOKEN,
	BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN,
	BoardImportConfig,
	type BoardImportPublicApiConfig,
} from '../../board-import.config';
import {
	type BoardImportJob,
	BoardImportJobLogReason,
	BoardImportJobStatus,
	BoardImportNoteType,
	type BoardImportSource,
	BoardImportSourceRegistryService,
	BoardImportSourceService,
} from '../../domain';
import { BoardImportSourceReaderRegistryService } from '../../domain/service/board-import-source-reader-registry.service';
import { BoardImportRunnerService } from '../../domain/service/board-import-runner.service';
import { BoardImportSourceHttpClientService } from '../../domain/service/board-import-source-http-client.service';
import { BoardImportJobEntity, BoardImportNoteEmbeddable } from '../../repo/entity';
import { type BoardImportJobResponse } from '../dto';
import { boardImportJobEntityFactory, boardImportJobFactory, boardPlanFactory } from '../../testing';

const baseRouteName = 'board-import/jobs';

const taskcardsSource: BoardImportSource = {
	type: BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
	link: 'https://www.taskcards.de/#/board/793bed21-a8ac-4a26-910e-2c3305ac6c0d',
};
const buildTaskcardsJob = (): BoardImportJob => boardImportJobFactory.build({ source: taskcardsSource });

describe('Board Import Controller (API)', () => {
	let app: INestApplication;
	let jwtConfig: TestJwtModuleConfig;
	let em: EntityManager;
	let amqpConnection: AmqpConnection;
	let config: BoardImportPublicApiConfig;
	let runtimeConfigService: RuntimeConfigService;
	let sourceRegistry: BoardImportSourceRegistryService;
	let sourceService: BoardImportSourceService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [BoardImportApiTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
		em = module.get(EntityManager);
		amqpConnection = module.get(AmqpConnection);
		config = module.get(BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN);
		runtimeConfigService = module.get(RuntimeConfigService);
		sourceRegistry = module.get(BoardImportSourceRegistryService);
		sourceService = module.get(BoardImportSourceService);
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

	const setSourceSwitch = async (sourceType: string, isEnabled: boolean) => {
		const switchKey = sourceService.getSwitchKey(sourceType);
		const value = await runtimeConfigService.getByKey(switchKey);
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

	describe('when the app is created', () => {
		it('should not contain the registry of the readers', () => {
			expect(() => app.get(BoardImportSourceReaderRegistryService, { strict: false })).toThrow();
		});
	});

	describe('[POST] board-import/jobs', () => {
		describe('when the user is not authenticated', () => {
			const setup = () => {
				const { source, target } = buildTaskcardsJob();
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
				const { source, target } = buildTaskcardsJob();
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
				const { source, target } = buildTaskcardsJob();
				const { link } = source;
				const body = { link, targetType: target.type, targetId: target.id };
				const status = BoardImportJobStatus.WAITING;

				return { loggedInClient, teacherUser, link, source, target, body, status };
			};

			it('should return status 201 with the id and the status of the job', async () => {
				const { loggedInClient, body, status } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(201);
				expect(response.body).toEqual({ id: expect.any(String), status, notes: [] });
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
				name: 'has a host with a dot at the end',
				link: 'https://www.taskcards.de\u3002/board',
				type: 'BOARD_IMPORT_LINK_INVALID',
			},
			{
				name: 'does not point to a known source',
				link: 'https://example.com/board',
				type: 'BOARD_IMPORT_SOURCE_UNKNOWN',
			},
		])('when the link $name', ({ link, type }) => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = buildTaskcardsJob();
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

				const countBefore = await em.count(BoardImportJobEntity);

				await loggedInClient.post('', body);

				const countAfter = await em.count(BoardImportJobEntity);
				expect(countAfter).toEqual(countBefore);
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
				const { source, target } = buildTaskcardsJob();
				const body = { link: source.link, targetType: target.type, targetId: target.id };
				const type = 'BOARD_IMPORT_SOURCE_DISABLED';
				await setSourceSwitch(source.type, false);

				return { loggedInClient, body, type };
			};

			it('should return status 403 with the type of the error', async () => {
				const { loggedInClient, body, type } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(403);
				expect(response.body).toEqual(expect.objectContaining({ type }));
			});

			it('should not store a job', async () => {
				const { loggedInClient, body } = await setup();

				const countBefore = await em.count(BoardImportJobEntity);

				await loggedInClient.post('', body);

				const countAfter = await em.count(BoardImportJobEntity);
				expect(countAfter).toEqual(countBefore);
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
				const { source, target } = buildTaskcardsJob();
				const body = { link: source.link, targetType: target.type, targetId: target.id };
				await setSourceSwitch(source.type, false);
				const rejectedResponse = await loggedInClient.post('', body);
				await setSourceSwitch(source.type, true);

				return { loggedInClient, body, rejectedResponse };
			};

			it('should reject the start while the source is off and accept it after', async () => {
				const { loggedInClient, body, rejectedResponse } = await setup();

				const response = await loggedInClient.post('', body);

				expect(rejectedResponse.status).toEqual(403);
				expect(response.status).toEqual(201);
			});
		});

		describe('when the registered sources are read', () => {
			const setup = () => {
				const sourceTypes = sourceRegistry.getAll().map((definition) => definition.type);

				return { sourceTypes };
			};

			it('should contain the TaskCards source', () => {
				const { sourceTypes } = setup();

				expect(sourceTypes).toContain(BOARD_IMPORT_TASKCARDS_SOURCE_TYPE);
			});
		});

		describe('when the switches of all sources are read', () => {
			const setup = () => {
				const switchKeys = sourceRegistry.getAll().map((definition) => definition.switchKey);

				return { switchKeys };
			};

			it('should find a boolean key in the runtime config for each source', async () => {
				const { switchKeys } = setup();

				const values = await Promise.all(switchKeys.map((key) => runtimeConfigService.getBoolean(key)));

				expect(switchKeys.length).toBeGreaterThan(0);
				expect(values.map((value) => typeof value)).toEqual(switchKeys.map(() => 'boolean'));
			});
		});

		describe('when the link has no https scheme', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = buildTaskcardsJob();
				const link = 'http://www.taskcards.de/board';
				const body = { link, targetType: target.type, targetId: target.id };

				const type = 'API_VALIDATION_ERROR';

				return { loggedInClient, body, type };
			};

			it('should return status 400 with the type of the error', async () => {
				const { loggedInClient, body, type } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
				expect(response.body).toEqual(expect.objectContaining({ type }));
			});
		});

		describe('when the link has no scheme', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = buildTaskcardsJob();
				const link = 'www.taskcards.de/board';
				const body = { link, targetType: target.type, targetId: target.id };

				const type = 'API_VALIDATION_ERROR';

				return { loggedInClient, body, type };
			};

			it('should return status 400 with the type of the error', async () => {
				const { loggedInClient, body, type } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
				expect(response.body).toEqual(expect.objectContaining({ type }));
			});
		});

		describe('when the link contains credentials', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = buildTaskcardsJob();
				const link = 'https://user:password@www.taskcards.de/board';
				const body = { link, targetType: target.type, targetId: target.id };

				const type = 'API_VALIDATION_ERROR';

				return { loggedInClient, body, type };
			};

			it('should return status 400 with the type of the error', async () => {
				const { loggedInClient, body, type } = await setup();

				const response = await loggedInClient.post('', body);

				expect(response.status).toEqual(400);
				expect(response.body).toEqual(expect.objectContaining({ type }));
			});
		});

		describe('when the link is missing', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { target } = buildTaskcardsJob();
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
				const { source, target } = buildTaskcardsJob();
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
				const { source, target } = buildTaskcardsJob();
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
				expect(response.body).toEqual({ id: entity.id, status: entity.status, notes: [] });
			});
		});

		describe('when the job of the user is finished with notes', () => {
			const setup = async () => {
				const { loggedInClient, teacherUser } = await setupLoggedInClient();
				const notes = [
					{ type: BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT },
					{
						type: BoardImportNoteType.ELEMENT_LEFT_OUT,
						sectionTitle: 'Section',
						cardTitle: 'Card',
						elementType: 'not-supported',
						elementKind: 'contact',
					},
				];
				const entity = boardImportJobEntityFactory.build({
					userId: new ObjectId(teacherUser.id),
					status: BoardImportJobStatus.FINISHED,
					notes: notes.map((note) => new BoardImportNoteEmbeddable(note)),
				});
				await em.persist(entity).flush();
				em.clear();

				return { loggedInClient, entity, notes };
			};

			it('should return the notes of the job', async () => {
				const { loggedInClient, entity, notes } = await setup();

				const response = await loggedInClient.get(entity.id);

				expect(response.status).toEqual(200);
				expect(response.body).toEqual({ id: entity.id, status: entity.status, notes });
			});
		});

		describe('when the job of the user is running with a plan and checkpoints', () => {
			const setup = async () => {
				const { loggedInClient, teacherUser } = await setupLoggedInClient();
				const plan = boardPlanFactory.build({
					columns: [
						{ title: 'First', cards: [{ title: 'Card', elements: [] }] },
						{ title: 'Second', cards: [{ title: 'Card', elements: [] }] },
					],
				});
				const entity = boardImportJobEntityFactory.build({
					userId: new ObjectId(teacherUser.id),
					status: BoardImportJobStatus.RUNNING,
					plan,
					checkpoints: [
						{ columnId: new ObjectId(), cardIds: [new ObjectId()] },
						{ columnId: new ObjectId(), cardIds: [] },
					],
				});
				await em.persist(entity).flush();
				em.clear();
				const progress = { total: 4, imported: 3 };

				return { loggedInClient, entity, progress };
			};

			it('should return the progress of the job and not the plan', async () => {
				const { loggedInClient, entity, progress } = await setup();

				const response = await loggedInClient.get(entity.id);

				expect(response.status).toEqual(200);
				expect(response.body).toEqual({ id: entity.id, status: entity.status, notes: [], progress });
			});
		});

		describe('when the job of the user is failed', () => {
			const setup = async () => {
				const { loggedInClient, teacherUser } = await setupLoggedInClient();
				const failureReason = BoardImportJobLogReason.SOURCE_NOT_READABLE;
				const entity = boardImportJobEntityFactory.build({
					userId: new ObjectId(teacherUser.id),
					status: BoardImportJobStatus.FAILED,
					failureReason,
				});
				await em.persist(entity).flush();
				em.clear();

				return { loggedInClient, entity, failureReason };
			};

			it('should return the reason of the failure', async () => {
				const { loggedInClient, entity, failureReason } = await setup();

				const response = await loggedInClient.get(entity.id);

				expect(response.status).toEqual(200);
				expect(response.body).toEqual({ id: entity.id, status: entity.status, failureReason, notes: [] });
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
	let sourceHttpClient: DeepMocked<BoardImportSourceHttpClientService>;
	let metaTagsClient: DeepMocked<MetaTagsClientAdapter>;

	const { link, type: sourceType } = taskcardsSource;
	const mockSource = (boardFixture: string): void => {
		const visitorBody = readTaskcardsFixture('create-visitor.json');
		const boardBody = readTaskcardsFixture(boardFixture);
		sourceHttpClient.request
			.mockResolvedValueOnce({ status: 200, body: visitorBody })
			.mockResolvedValueOnce({ status: 200, body: boardBody });
	};

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
			.overrideProvider(BoardImportSourceHttpClientService)
			.useValue(createMock<BoardImportSourceHttpClientService>())
			.overrideProvider(MetaTagsClientAdapter)
			.useValue(createMock<MetaTagsClientAdapter>())
			.overrideProvider(FilesStorageClientAdapter)
			.useValue(createMock<FilesStorageClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		amqpConnection = module.get(AmqpConnection);
		boardsClient = module.get(BoardsClientAdapter);
		columnClient = module.get(ColumnClientAdapter);
		cardClient = module.get(CardClientAdapter);
		sourceHttpClient = module.get(BoardImportSourceHttpClientService);
		metaTagsClient = module.get(MetaTagsClientAdapter);
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
			const entity = boardImportJobEntityFactory.build({ userId: new ObjectId(teacherUser.id), link, sourceType });
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
			boardsClient.createBoardColumn.mockImplementation(() =>
				Promise.resolve(createMock<ColumnResponse>({ id: new ObjectId().toHexString(), title: '', cards: [] }))
			);
			columnClient.createCard.mockImplementation((_token, _columnId, params) => {
				const elements = (params.requiredEmptyElements ?? []).map((type) =>
					createMock<CardResponse['elements'][number]>({ id: new ObjectId().toHexString(), type })
				);
				const card = createMock<CardResponse>({ id: new ObjectId().toHexString(), title: undefined, elements });

				return Promise.resolve(card);
			});
			mockSource('board-pinboard.json');
			const linkTitle = 'FWU';
			const linkUrl = 'https://fwu.de/';
			metaTagsClient.getMetaTags.mockResolvedValueOnce({
				url: linkUrl,
				title: linkTitle,
				description: '',
				type: MetaDataEntityType.EXTERNAL,
			});

			const expectedBoardTitle = 'Test Pinboard';
			const expectedColumnTitles = ['Green', 'Yellow', 'Red', 'No color'];
			const expectedCardTitles = ['FWU', 'Rich text', 'Foobar', 'Collapsed ugly card', 'Video call', 'PDF'];
			const expectedLastText = 'Picture + colors changed';
			const expectedNoteTypes = [
				BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT,
				...Array<BoardImportNoteType>(4).fill(BoardImportNoteType.ELEMENT_LEFT_OUT),
			];
			const expectedLink = { url: linkUrl, title: linkTitle };

			return {
				id: entity.id,
				boardId,
				expectedClaims,
				expectedBoardTitle,
				expectedColumnTitles,
				expectedCardTitles,
				expectedLastText,
				expectedNoteTypes,
				expectedLink,
			};
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

		it('should create the columns, cards and texts of the source board', async () => {
			const { id, expectedBoardTitle, expectedColumnTitles, expectedCardTitles, expectedLastText } = await setup();

			await publishJob(amqpConnection, id);

			await waitForStatus(em, id, BoardImportJobStatus.FINISHED);
			expect(boardsClient.createBoard).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ title: expectedBoardTitle })
			);
			expect(columnClient.updateBoardColumnTitle.mock.calls.map((call) => call[2].title)).toEqual(expectedColumnTitles);
			expect(cardClient.updateCardTitle.mock.calls.map((call) => call[2].title)).toEqual(expectedCardTitles);
			expect(cardClient.updateCardElement).toHaveBeenCalledTimes(3);
			expect(cardClient.updateCardElement).toHaveBeenLastCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({
					data: expect.objectContaining({ content: expect.objectContaining({ text: expectedLastText }) }),
				})
			);
		});

		it('should create the link of a card as a link element with its preview', async () => {
			const { id, expectedLink } = await setup();

			await publishJob(amqpConnection, id);

			await waitForStatus(em, id, BoardImportJobStatus.FINISHED);
			expect(cardClient.updateCardElement).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining({
					data: { type: ContentElementType.LINK, content: expect.objectContaining(expectedLink) },
				})
			);
		});

		it('should store the import notes in the job', async () => {
			const { id, expectedNoteTypes } = await setup();

			await publishJob(amqpConnection, id);

			const finishedJob = await waitForStatus(em, id, BoardImportJobStatus.FINISHED);
			expect(finishedJob.notes?.map((note) => note.type)).toEqual(expectedNoteTypes);
		});
	});

	describe('when the source of the job is not readable', () => {
		const setup = async () => {
			const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
			const entity = boardImportJobEntityFactory.build({ userId: new ObjectId(teacherUser.id), link, sourceType });
			await em.persist([teacherUser, teacherAccount, entity]).flush();
			em.clear();
			mockSource('board-not-readable.json');

			const attempts = 1;

			return { id: entity.id, attempts };
		};

		it('should set the job to failed on the first attempt and create no board', async () => {
			const { id, attempts } = await setup();

			await publishJob(amqpConnection, id);

			const failedJob = await waitForStatus(em, id, BoardImportJobStatus.FAILED);
			expect(failedJob.attempts).toEqual(attempts);
			expect(failedJob.failureReason).toEqual(BoardImportJobLogReason.SOURCE_NOT_READABLE);
			expect(failedJob.boardId).toBeUndefined();
			expect(boardsClient.createBoard).not.toHaveBeenCalled();
		});
	});

	describe('when the app is created', () => {
		it('should contain the reader of TaskCards', () => {
			const reader = app.get(BoardImportSourceReaderRegistryService).findByType(sourceType);

			expect(reader).toBeDefined();
		});
	});

	describe('when no reader is registered for the source of the job', () => {
		const setup = async () => {
			const entity = boardImportJobEntityFactory.build({ sourceType: 'removed-source' });
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

	describe('when the user of the job does not exist', () => {
		const setup = async () => {
			const entity = boardImportJobEntityFactory.build({ link, sourceType });
			await em.persist(entity).flush();
			em.clear();
			mockSource('board-pinboard.json');

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
