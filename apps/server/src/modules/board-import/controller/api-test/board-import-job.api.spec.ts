import { CoreModule } from '@core/core.module';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { ConfigurationModule } from '@infra/configuration';
import { User } from '@modules/user';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { BoardImportApiModule } from '../../board-import-api.module';
import { BoardImportJobStatus } from '../../domain';
import { boardImportJobFactory } from '../../testing';

const baseRouteName = 'board-import/jobs';

describe('Board Import Controller (API)', () => {
	let app: INestApplication;
	let jwtConfig: TestJwtModuleConfig;

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
				MongoMemoryDatabaseModule.forRoot({ entities: [User] }),
				ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig),
			],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	const setupLoggedInClient = async () => {
		const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
		const loggedInClient = await new TestApiClientBuilder(app, baseRouteName)
			.withJwt(teacherUser, jwtConfig)
			.build(teacherAccount);

		return { loggedInClient };
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
				const status = BoardImportJobStatus.FAILED;

				return { loggedInClient, link, status };
			};

			it('should return status 201 with the id and the status of the job', async () => {
				const { loggedInClient, link, status } = await setup();

				const response = await loggedInClient.post('', { link });

				expect(response.status).toEqual(201);
				expect(response.body).toEqual({ id: expect.any(String), status });
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
