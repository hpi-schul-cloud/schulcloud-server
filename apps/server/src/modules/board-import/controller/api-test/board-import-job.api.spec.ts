import { CoreModule } from '@core/core.module';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { ConfigurationModule } from '@infra/configuration';
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
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, type BoardImportExchangeConfig } from '../../board-import-exchange.config';
import { ENTITIES } from '../../board-import.entity.imports';
import { BoardImportJobStatus } from '../../domain';
import { BoardImportJobEntity } from '../../repo/entity';
import { type BoardImportJobResponse } from '../dto';
import { boardImportJobEntityFactory, boardImportJobFactory } from '../../testing';

const baseRouteName = 'board-import/jobs';

describe('Board Import Controller (API)', () => {
	let app: INestApplication;
	let jwtConfig: TestJwtModuleConfig;
	let em: EntityManager;
	let amqpConnection: AmqpConnection;
	let exchangeConfig: BoardImportExchangeConfig;

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
				MongoMemoryDatabaseModule.forRoot({ entities: [User, ...ENTITIES] }),
				ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig),
			],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
		em = module.get(EntityManager);
		amqpConnection = module.get(AmqpConnection);
		exchangeConfig = module.get(BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

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
				const { link } = boardImportJobFactory.build();

				return { link };
			};

			it('should return status 401', async () => {
				const { link } = setup();

				const response = await new TestApiClientBuilder(app, baseRouteName).build().post('', { link });

				expect(response.status).toEqual(401);
			});
		});

		describe('when the link is a valid https link', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { link } = boardImportJobFactory.build();
				const status = BoardImportJobStatus.WAITING;
				const publishSpy = jest.spyOn(amqpConnection, 'publish');

				return { loggedInClient, link, status, publishSpy };
			};

			it('should return status 201 with the id and the status of the job', async () => {
				const { loggedInClient, link, status } = await setup();

				const response = await loggedInClient.post('', { link });

				expect(response.status).toEqual(201);
				expect(response.body).toEqual({ id: expect.any(String), status });
			});

			it('should store the job', async () => {
				const { loggedInClient, link, status } = await setup();

				const response = await loggedInClient.post('', { link });

				const { id } = response.body as BoardImportJobResponse;
				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(entity).toMatchObject({ link, status });
			});

			it('should publish the id of the job', async () => {
				const { loggedInClient, link, publishSpy } = await setup();

				const response = await loggedInClient.post('', { link });

				const { id } = response.body as BoardImportJobResponse;
				expect(publishSpy).toHaveBeenCalledWith(exchangeConfig.exchangeName, BoardImportEvents.IMPORT_JOB, {
					jobId: id,
				});
			});
		});

		describe('when the link has no https scheme', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { link } = boardImportJobFactory.build({ link: 'http://example.com/board' });

				return { loggedInClient, link };
			};

			it('should return status 400', async () => {
				const { loggedInClient, link } = await setup();

				const response = await loggedInClient.post('', { link });

				expect(response.status).toEqual(400);
			});
		});

		describe('when the link has no scheme', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { link } = boardImportJobFactory.build({ link: 'example.com/board' });

				return { loggedInClient, link };
			};

			it('should return status 400', async () => {
				const { loggedInClient, link } = await setup();

				const response = await loggedInClient.post('', { link });

				expect(response.status).toEqual(400);
			});
		});

		describe('when the link contains credentials', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();
				const { link } = boardImportJobFactory.build({ link: 'https://user:password@example.com/board' });

				return { loggedInClient, link };
			};

			it('should return status 400', async () => {
				const { loggedInClient, link } = await setup();

				const response = await loggedInClient.post('', { link });

				expect(response.status).toEqual(400);
			});
		});

		describe('when the link is missing', () => {
			const setup = async () => {
				const { loggedInClient } = await setupLoggedInClient();

				return { loggedInClient };
			};

			it('should return status 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post('', {});

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
