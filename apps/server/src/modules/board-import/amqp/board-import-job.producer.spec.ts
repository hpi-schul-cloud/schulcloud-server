import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from '../board-import-exchange.config';
import { boardImportJobFactory } from '../testing';
import { type BoardImportJobMessage } from './board-import-job.message';
import { BOARD_IMPORT_JOB_PUBLISH_TIMEOUT_IN_MS, BoardImportJobProducer } from './board-import-job.producer';
import { BoardImportEvents } from './board-import.exchange';

describe(BoardImportJobProducer.name, () => {
	let module: TestingModule;
	let producer: BoardImportJobProducer;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let config: BoardImportExchangeConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportJobProducer,
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN,
					useValue: new BoardImportExchangeConfig(),
				},
			],
		}).compile();

		producer = module.get(BoardImportJobProducer);
		amqpConnection = module.get(AmqpConnection);
		config = module.get(BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('publishJob', () => {
		describe('when the job expires in the future', () => {
			const setup = () => {
				const now = new Date('2026-01-01T00:00:00.000Z');
				jest.useFakeTimers({ now });

				const { id, expiresAt } = boardImportJobFactory.build({ expiresAt: new Date('2026-01-31T00:00:00.000Z') });
				const message: BoardImportJobMessage = { jobId: id };
				const expiration = expiresAt.getTime() - now.getTime();

				return { message, expiresAt, expiration };
			};

			afterEach(() => {
				jest.useRealTimers();
			});

			it('should publish the message persistently with the remaining lifetime of the job and a timeout', async () => {
				const { message, expiresAt, expiration } = setup();

				await producer.publishJob(message, expiresAt);

				expect(amqpConnection.publish).toHaveBeenCalledWith(
					config.exchangeName,
					BoardImportEvents.IMPORT_JOB,
					message,
					{
						persistent: true,
						expiration,
						timeout: BOARD_IMPORT_JOB_PUBLISH_TIMEOUT_IN_MS,
					}
				);
			});
		});

		describe('when the job is already expired', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const message: BoardImportJobMessage = { jobId: id };
				const expiresAt = new Date(Date.now() - 1000);

				return { message, expiresAt };
			};

			it('should publish the message with an expiration of 0', async () => {
				const { message, expiresAt } = setup();

				await producer.publishJob(message, expiresAt);

				expect(amqpConnection.publish).toHaveBeenCalledWith(
					config.exchangeName,
					BoardImportEvents.IMPORT_JOB,
					message,
					expect.objectContaining({ expiration: 0 })
				);
			});
		});
	});
});
