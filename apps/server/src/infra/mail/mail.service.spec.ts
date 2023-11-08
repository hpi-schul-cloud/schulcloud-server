import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Test, TestingModule } from '@nestjs/testing';
import { Mail } from './mail.interface';
import { MailService } from './mail.service';

describe('MailService', () => {
	let module: TestingModule;
	let service: MailService;
	let amqpConnection: AmqpConnection;

	const mailServiceOptions = {
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MailService,
				{ provide: AmqpConnection, useValue: { publish: () => {} } },
				{ provide: 'MAIL_SERVICE_OPTIONS', useValue: mailServiceOptions },
			],
		}).compile();

		service = module.get(MailService);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should send given data to queue', async () => {
		const data: Mail = { mail: { plainTextContent: 'content', subject: 'Test' }, recipients: ['test@example.com'] };
		const amqpConnectionSpy = jest.spyOn(amqpConnection, 'publish');

		await service.send(data);

		const expectedParams = [mailServiceOptions.exchange, mailServiceOptions.routingKey, data, { persistent: true }];
		expect(amqpConnectionSpy).toHaveBeenCalledWith(...expectedParams);
	});
});
