import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteContentParams, H5pEditorEvents } from '../h5p-editor.interface';
import { H5P_EXCHANGE_CONFIG_TOKEN, type H5pExchangeConfig } from '../h5p-exchange.config';
import { h5pEditorExchangeCopyContentParamsFactory } from '../testing';
import { H5pEditorProducer } from './h5p-editor.producer';

describe(H5pEditorProducer.name, () => {
	let module: TestingModule;
	let producer: H5pEditorProducer;
	let config: H5pExchangeConfig;

	let amqpConnection: DeepMocked<AmqpConnection>;

	const exchangeName = 'h5p-exchange';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: H5P_EXCHANGE_CONFIG_TOKEN,
					useValue: {
						exchangeName,
					},
				},
			],
		}).compile();

		amqpConnection = module.get(AmqpConnection);
		config = module.get(H5P_EXCHANGE_CONFIG_TOKEN);
		producer = new H5pEditorProducer(amqpConnection, config);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('deleteContent', () => {
		describe('when sending a message', () => {
			const setup = () => {
				const message: DeleteContentParams = {
					contentId: new ObjectId().toHexString(),
				};

				return {
					message,
				};
			};

			it('should publish the message', async () => {
				const { message } = setup();

				await producer.deleteContent(message);

				expect(amqpConnection.publish).toHaveBeenCalledWith(exchangeName, H5pEditorEvents.DELETE_CONTENT, message);
			});
		});
	});

	describe('copyContent', () => {
		describe('when sending a message', () => {
			it('should publish the message', async () => {
				const message = h5pEditorExchangeCopyContentParamsFactory.build();

				await producer.copyContent(message);

				expect(amqpConnection.publish).toHaveBeenCalledWith(exchangeName, H5pEditorEvents.COPY_CONTENT, message);
			});
		});
	});
});
