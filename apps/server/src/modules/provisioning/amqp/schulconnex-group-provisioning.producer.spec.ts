import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchulconnexGroupProvisioningMessage, SchulconnexGroupRemovalMessage } from '../domain';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN } from '../provisioning-exchange.config';
import { externalGroupDtoFactory, externalSchoolDtoFactory } from '../testing';
import { SchulconnexGroupProvisioningProducer } from './schulconnex-group-provisioning.producer';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

describe(SchulconnexGroupProvisioningProducer.name, () => {
	let module: TestingModule;
	let producer: SchulconnexGroupProvisioningProducer;
	let amqpConnection: DeepMocked<AmqpConnection>;

	const exchangeName = 'provisioning-exchange';
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexGroupProvisioningProducer,
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: PROVISIONING_EXCHANGE_CONFIG_TOKEN,
					useValue: {
						exchangeName,
						exchangeType: 'direct',
					},
				},
			],
		}).compile();

		producer = module.get(SchulconnexGroupProvisioningProducer);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisonGroup', () => {
		describe('when sending a message', () => {
			const setup = () => {
				const message: SchulconnexGroupProvisioningMessage = {
					systemId: new ObjectId().toHexString(),
					externalSchool: externalSchoolDtoFactory.build(),
					externalGroup: externalGroupDtoFactory.build(),
				};

				return {
					message,
				};
			};

			it('should publish the message', async () => {
				const { message } = setup();

				await producer.provisonGroup(message);

				expect(amqpConnection.publish).toHaveBeenCalledWith(
					exchangeName,
					SchulconnexProvisioningEvents.GROUP_PROVISIONING,
					message
				);
			});
		});
	});

	describe('removeUserFromGroup', () => {
		describe('when sending a message', () => {
			const setup = () => {
				const message: SchulconnexGroupRemovalMessage = {
					groupId: new ObjectId().toHexString(),
					userId: new ObjectId().toHexString(),
				};

				return {
					message,
				};
			};

			it('should publish the message', async () => {
				const { message } = setup();

				await producer.removeUserFromGroup(message);

				expect(amqpConnection.publish).toHaveBeenCalledWith(
					exchangeName,
					SchulconnexProvisioningEvents.GROUP_REMOVAL,
					message
				);
			});
		});
	});
});
