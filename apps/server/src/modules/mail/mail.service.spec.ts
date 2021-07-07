import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
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

	it('should send given data to queue', () => {
		const data: Mail = { mail: { plainTextContent: 'content', subject: 'Test' }, recipients: ['test@example.com']};
		const amqpConnectionSpy = jest.spyOn(amqpConnection, 'publish');
		service.send(data);
		const expectedParams = [mailServiceOptions.exchange, mailServiceOptions.routingKey, data];
		expect(amqpConnectionSpy).toHaveBeenCalledWith(...expectedParams);
	})
});
