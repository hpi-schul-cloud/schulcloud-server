import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from '../board-import-exchange.config';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../board-import.config';
import { BoardImportJobProcessService } from '../domain';
import { BoardImportJobEntity } from '../repo/entity';
import { boardImportJobFactory } from '../testing';
import { BoardImportJobConsumer } from './board-import-job.consumer';
import { type BoardImportJobMessage } from './board-import-job.message';
import { BoardImportEvents } from './board-import.exchange';

describe(BoardImportJobConsumer.name, () => {
	let module: TestingModule;
	let consumer: BoardImportJobConsumer;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let processService: DeepMocked<BoardImportJobProcessService>;
	let logger: DeepMocked<Logger>;
	let exchangeConfig: BoardImportExchangeConfig;
	let config: BoardImportConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			// RequestContext needs a real MikroORM instance.
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BoardImportJobEntity] })],
			providers: [
				BoardImportJobConsumer,
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN,
					useValue: new BoardImportExchangeConfig(),
				},
				{
					provide: BOARD_IMPORT_CONFIG_TOKEN,
					useValue: new BoardImportConfig(),
				},
				{
					provide: BoardImportJobProcessService,
					useValue: createMock<BoardImportJobProcessService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		consumer = module.get(BoardImportJobConsumer);
		amqpConnection = module.get(AmqpConnection);
		processService = module.get(BoardImportJobProcessService);
		logger = module.get(Logger);
		exchangeConfig = module.get(BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN);
		config = module.get(BOARD_IMPORT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.useRealTimers();
	});

	describe('onModuleInit', () => {
		describe('when the module starts', () => {
			const setup = () => {
				const expectedOptions = {
					exchange: exchangeConfig.exchangeName,
					routingKey: BoardImportEvents.IMPORT_JOB,
					queue: BoardImportEvents.IMPORT_JOB,
				};

				return { expectedOptions };
			};

			it('should subscribe to the import job queue', async () => {
				const { expectedOptions } = setup();

				await consumer.onModuleInit();

				expect(amqpConnection.createSubscriber).toHaveBeenCalledWith(
					expect.any(Function),
					expectedOptions,
					BoardImportJobConsumer.name
				);
			});
		});

		describe('when the subscriber gets a message', () => {
			const setup = async () => {
				const { id } = boardImportJobFactory.build();
				const message: BoardImportJobMessage = { jobId: id };

				await consumer.onModuleInit();
				const [handler] = amqpConnection.createSubscriber.mock.calls[0];

				return { id, message, handler };
			};

			it('should process the job of the message', async () => {
				const { id, message, handler } = await setup();

				await handler(message);

				expect(processService.process).toHaveBeenCalledWith(id);
			});
		});
	});

	describe('handleMessage', () => {
		describe('when the job is still in work', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const message: BoardImportJobMessage = { jobId: id };
				let finishJob = (): void => {};
				let isHandled = false;

				processService.process.mockReturnValueOnce(
					new Promise<void>((resolve) => {
						finishJob = resolve;
					})
				);

				const getIsHandled = (): boolean => isHandled;
				const setIsHandled = (): void => {
					isHandled = true;
				};

				return { message, finishJob: () => finishJob(), getIsHandled, setIsHandled };
			};

			it('should not resolve before the job has its end status', async () => {
				const { message, finishJob, getIsHandled, setIsHandled } = setup();

				const result = consumer.handleMessage(message).then(setIsHandled);
				await new Promise(setImmediate);
				const isHandledBeforeEnd = getIsHandled();
				finishJob();
				await result;

				expect(isHandledBeforeEnd).toEqual(false);
				expect(getIsHandled()).toEqual(true);
			});
		});

		describe('when the processing rejects', () => {
			const setup = () => {
				jest.useFakeTimers();

				const { id } = boardImportJobFactory.build();
				const message: BoardImportJobMessage = { jobId: id };
				const logEntry = ['Board import job goes back to the queue', { jobId: id }] as const;
				const delayInMs = config.jobRetryDelayInSeconds * 1000;
				const requeue = new Nack(true);

				processService.process.mockRejectedValueOnce(new Error('https://example.com/board'));

				return { message, logEntry, delayInMs, requeue };
			};

			it('should give the message back to the queue after the retry delay', async () => {
				const { message, delayInMs, requeue } = setup();
				const onSettled = jest.fn();

				const result = consumer.handleMessage(message).finally(onSettled);
				await jest.advanceTimersByTimeAsync(delayInMs - 1);
				expect(onSettled).not.toHaveBeenCalled();
				await jest.advanceTimersByTimeAsync(1);

				await expect(result).resolves.toEqual(requeue);
			});

			it('should log the job id without the error', async () => {
				const { message, logEntry, delayInMs } = setup();

				const result = consumer.handleMessage(message);
				await jest.advanceTimersByTimeAsync(delayInMs);
				await result;

				expect(logger.warning).toHaveBeenCalledTimes(1);
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the message has no job id', () => {
			const setup = () => {
				const logEntry = ['Board import job message without job id dropped'] as const;

				return { logEntry };
			};

			it('should resolve and not process a job', async () => {
				const { logEntry } = setup();

				await consumer.handleMessage(undefined);

				expect(processService.process).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});
	});
});
