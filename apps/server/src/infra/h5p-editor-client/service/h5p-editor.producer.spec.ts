import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DeleteContentParams, H5pEditorEvents, H5pEditorExchange } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { H5pEditorProducer } from './h5p-editor.producer';

describe(H5pEditorProducer.name, () => {
	let module: TestingModule;
	let producer: H5pEditorProducer;

	let amqpConnection: DeepMocked<AmqpConnection>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5pEditorProducer,
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
			],
		}).compile();

		producer = module.get(H5pEditorProducer);
		amqpConnection = module.get(AmqpConnection);
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

				expect(amqpConnection.publish).toHaveBeenCalledWith(H5pEditorExchange, H5pEditorEvents.DELETE_CONTENT, message);
			});
		});
	});
});
