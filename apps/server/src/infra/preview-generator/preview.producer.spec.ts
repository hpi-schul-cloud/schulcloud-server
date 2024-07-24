import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ErrorMapper, FilesPreviewEvents, FilesPreviewExchange } from '../rabbitmq';
import { PreviewFileOptions } from './interface';
import { PreviewProducer } from './preview.producer';

describe('PreviewProducer', () => {
	let module: TestingModule;
	let service: PreviewProducer;
	let amqpConnection: DeepMocked<AmqpConnection>;

	const timeout = 10000;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				PreviewProducer,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>({
						get: jest.fn().mockImplementation((key: string) => {
							if (key === 'INCOMING_REQUEST_TIMEOUT') {
								return timeout;
							}
							throw new Error('Config key not found');
						}),
					}),
				},
			],
		}).compile();

		service = module.get(PreviewProducer);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('generate', () => {
		describe('when valid params are passed and amqp connection return with a message', () => {
			const setup = () => {
				const params: PreviewFileOptions = {
					originFilePath: 'file/test.jpeg',
					previewFilePath: 'preview/text.webp',
					previewOptions: {
						format: 'webp',
						width: 500,
					},
				};

				const message = [];
				amqpConnection.request.mockResolvedValueOnce({ message });

				const expectedParams = {
					exchange: FilesPreviewExchange,
					routingKey: FilesPreviewEvents.GENERATE_PREVIEW,
					payload: params,
					timeout,
					expiration: timeout * 1.5,
				};

				return { params, expectedParams, message };
			};

			it('should call the ampqConnection.', async () => {
				const { params, expectedParams } = setup();

				await service.generate(params);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { params, message } = setup();

				const res = await service.generate(params);

				expect(res).toEqual(message);
			});
		});

		describe('when amqpConnection return with error in response', () => {
			const setup = () => {
				const params: PreviewFileOptions = {
					originFilePath: 'file/test.jpeg',
					previewFilePath: 'preview/text.webp',
					previewOptions: {
						format: 'webp',
						width: 500,
					},
				};

				const error = new Error('An error from called service');

				amqpConnection.request.mockResolvedValueOnce({ error });
				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { params, spy, error };
			};

			it('should call error mapper and throw with error', async () => {
				const { params, spy, error } = setup();

				await expect(service.generate(params)).rejects.toThrowError(
					new InternalServerErrorException(null, { cause: error })
				);
				expect(spy).toBeCalled();
			});
		});
	});
});
