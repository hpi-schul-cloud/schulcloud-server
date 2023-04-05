import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuid } from 'uuid';
import { AntivirusService } from './antivirus.service';

describe('AntivirusService', () => {
	let module: TestingModule;
	let service: AntivirusService;
	let amqpConnection: DeepMocked<AmqpConnection>;

	const antivirusServiceOptions = {
		enabled: true,
		filesServiceBaseUrl: 'http://localhost',
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AntivirusService,
				{ provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
				{ provide: 'ANTIVIRUS_SERVICE_OPTIONS', useValue: antivirusServiceOptions },
			],
		}).compile();

		service = module.get(AntivirusService);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('send', () => {
		describe('when service can handle passing parameters', () => {
			const setup = () => {
				const requestToken = uuid();

				const expectedParams = [
					antivirusServiceOptions.exchange,
					antivirusServiceOptions.routingKey,
					{
						callback_uri: `http://localhost/api/v3/file-security/update-status/${requestToken}`,
						download_uri: `http://localhost/api/v3/file-security/download/${requestToken}`,
					},

					{ persistent: true },
				];

				return { requestToken, expectedParams };
			};

			it('should send given data to queue', () => {
				const { requestToken, expectedParams } = setup();

				service.send(requestToken);

				expect(amqpConnection.publish).toHaveBeenCalledWith(...expectedParams);
			});
		});

		describe('when amqpConnection throws an error', () => {
			const setup = () => {
				const requestToken = uuid();

				amqpConnection.publish.mockImplementationOnce(() => {
					throw new Error('fail');
				});

				return { requestToken };
			};

			it('should throw with InternalServerErrorException by error', () => {
				const { requestToken } = setup();

				expect(() => service.send(requestToken)).toThrow(InternalServerErrorException);
			});
		});
	});
});
