import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchulconnexProvisioningEvents, SchulconnexProvisioningExchange } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchulconnexLicenseProvisioningMessage } from '../domain';
import { SchulconnexLicenseProvisioningProducer } from './schulconnex-license-provisioning.producer';

describe(SchulconnexLicenseProvisioningProducer.name, () => {
	let module: TestingModule;
	let producer: SchulconnexLicenseProvisioningProducer;

	let amqpConnection: DeepMocked<AmqpConnection>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexLicenseProvisioningProducer,
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
			],
		}).compile();

		producer = module.get(SchulconnexLicenseProvisioningProducer);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisonLicenses', () => {
		describe('when sending a message', () => {
			const setup = () => {
				const message: SchulconnexLicenseProvisioningMessage = {
					userId: new ObjectId().toHexString(),
					schoolId: new ObjectId().toHexString(),
					systemId: new ObjectId().toHexString(),
					externalLicenses: [],
				};

				return {
					message,
				};
			};

			it('should publish the message', async () => {
				const { message } = setup();

				await producer.provisonLicenses(message);

				expect(amqpConnection.publish).toHaveBeenCalledWith(
					SchulconnexProvisioningExchange,
					SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
					message
				);
			});
		});
	});
});
