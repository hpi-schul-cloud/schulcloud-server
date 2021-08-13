import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MailService } from './mail.service';
import { Mail } from './mail.interface';

describe('MailService', () => {
	let service: MailService;
	let amqpConnection: AmqpConnection;

	const mailServiceOptions = {
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MailService,
				{ provide: AmqpConnection, useValue: { publish: () => {} } },
				{ provide: 'MAIL_SERVICE_OPTIONS', useValue: mailServiceOptions },
			],
		}).compile();

		service = module.get(MailService);
		amqpConnection = module.get(AmqpConnection);
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
