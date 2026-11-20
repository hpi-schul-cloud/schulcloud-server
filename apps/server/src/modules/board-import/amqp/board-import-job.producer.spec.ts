import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from '../board-import-exchange.config';
import { boardImportJobFactory } from '../testing';
import { type BoardImportJobMessage } from './board-import-job.message';
import { BoardImportJobProducer } from './board-import-job.producer';
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
		describe('when sending a message', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const message: BoardImportJobMessage = { jobId: id };

				return { message };
			};

			it('should publish the message persistently to the import job queue', async () => {
				const { message } = setup();

				await producer.publishJob(message);

				expect(amqpConnection.publish).toHaveBeenCalledWith(
					config.exchangeName,
					BoardImportEvents.IMPORT_JOB,
					message,
					{
						persistent: true,
					}
				);
			});
		});
	});
});
