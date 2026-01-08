import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CommonCartridgeEvents, CommonCartridgeExchange, ImportCourseParams } from '@infra/rabbitmq';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeProducer } from './common-cartridge.producer';
import { faker } from '@faker-js/faker/.';

describe(CommonCartridgeProducer.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeProducer;

	let amqpConnection: DeepMocked<AmqpConnection>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeProducer,
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeProducer);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('importCourse', () => {
		describe('when sending a message', () => {
			const setup = () => {
				const message: ImportCourseParams = {
					userId: faker.string.uuid(),
					jwt: faker.internet.jwt(),
					fileRecordId: faker.string.uuid(),
					fileName: faker.system.fileName(),
					fileUrl: faker.internet.url(),
				};

				return {
					message,
				};
			};

			it('should publish the message', async () => {
				const { message } = setup();

				await sut.importCourse(message);

				expect(amqpConnection.publish).toHaveBeenCalledWith(
					CommonCartridgeExchange,
					CommonCartridgeEvents.IMPORT_COURSE,
					message
				);
			});
		});
	});
});
