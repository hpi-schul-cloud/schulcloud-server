import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { BoardImportEvents, type BoardImportJobMessage } from '../../amqp';
import { BoardImportApiTestModule } from '../../board-import-api.app.module';
import { BoardImportJobStatus } from '../../domain';
import { boardImportJobFactory } from '../../testing';
import { type BoardImportJobResponse } from '../dto';

const baseRouteName = 'board-import/jobs';

describe('Board Import Scenario (API)', () => {
	let app: INestApplication;
	let jwtConfig: TestJwtModuleConfig;
	let amqpConnection: AmqpConnection;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [BoardImportApiTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
		amqpConnection = module.get(AmqpConnection);
		await amqpConnection.channel.purgeQueue(BoardImportEvents.IMPORT_JOB);
	});

	afterEach(async () => {
		await amqpConnection.channel.purgeQueue(BoardImportEvents.IMPORT_JOB);
	});

	afterAll(async () => {
		await app.close();
	});

	const readNextJobMessage = async (): Promise<BoardImportJobMessage | undefined> => {
		const message = await amqpConnection.channel.get(BoardImportEvents.IMPORT_JOB, { noAck: true });
		const jobMessage = message ? (JSON.parse(message.content.toString()) as BoardImportJobMessage) : undefined;

		return jobMessage;
	};

	describe('when a user starts the import of a board', () => {
		const setup = async () => {
			const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
			const loggedInClient = await new TestApiClientBuilder(app, baseRouteName)
				.withJwt(teacherUser, jwtConfig)
				.build(teacherAccount);
			const { link } = boardImportJobFactory.build();
			const status = BoardImportJobStatus.WAITING;

			return { loggedInClient, link, status };
		};

		it('should give the job to the import worker and show its status to the user', async () => {
			const { loggedInClient, link, status } = await setup();

			const startResponse = await loggedInClient.post('', { link });
			const { id } = startResponse.body as BoardImportJobResponse;
			const jobMessage = await readNextJobMessage();
			const statusResponse = await loggedInClient.get(id);

			expect(startResponse.status).toEqual(201);
			expect(startResponse.body).toEqual({ id: expect.any(String), status });
			expect(jobMessage).toEqual({ jobId: id });
			expect(statusResponse.status).toEqual(200);
			expect(statusResponse.body).toEqual({ id, status });
		});
	});
});
