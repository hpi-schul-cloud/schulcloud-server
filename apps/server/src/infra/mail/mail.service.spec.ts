import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailConfig } from './interfaces/mail-config';
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
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<MailConfig, true>>({ get: () => ['schul-cloud.org', 'example.com'] }),
				},
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

	describe('send', () => {
		describe('when recipients array is empty', () => {
			it('should not send email', async () => {
				const data: Mail = {
					mail: { plainTextContent: 'content', subject: 'Test' },
					recipients: ['test@schul-cloud.org'],
				};

				const amqpConnectionSpy = jest.spyOn(amqpConnection, 'publish');

				await service.send(data);

				expect(amqpConnectionSpy).toHaveBeenCalledTimes(0);
			});
		});
		describe('when sending email', () => {
			it('should remove email address that have blacklisted domain and send given data to queue', async () => {
				const data: Mail = {
					mail: { plainTextContent: 'content', subject: 'Test' },
					recipients: ['test@schul-cloud.org', 'test@example1.com', 'test2@schul-cloud.org', 'test3@schul-cloud.org'],
					cc: ['test@example.com', 'test5@schul-cloud.org', 'test6@schul-cloud.org'],
					bcc: ['test7@schul-cloud.org', 'test@example2.com', 'test8@schul-cloud.org'],
					replyTo: ['test@example3.com', 'test9@schul-cloud.org', 'test10@schul-cloud.org'],
				};

				const amqpConnectionSpy = jest.spyOn(amqpConnection, 'publish');

				await service.send(data);

				expect(data.recipients).toEqual(['test@example1.com']);
				expect(data.cc).toEqual([]);
				expect(data.bcc).toEqual(['test@example2.com']);
				expect(data.replyTo).toEqual(['test@example3.com']);

				const expectedParams = [mailServiceOptions.exchange, mailServiceOptions.routingKey, data, { persistent: true }];
				expect(amqpConnectionSpy).toHaveBeenCalledWith(...expectedParams);
			});
		});
	});
});
