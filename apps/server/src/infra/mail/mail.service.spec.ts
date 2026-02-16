import { Logger } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MAIL_CONFIG_TOKEN, MailConfig } from './mail.config';
import { Mail } from './mail.interface';
import { MailService } from './mail.service';

describe('MailService', () => {
	let module: TestingModule;
	let service: MailService;
	let amqpConnection: AmqpConnection;
	let config: MailConfig;
	let logger: DeepMocked<Logger>;

	const mailServiceOptions = {
		exchangeName: 'exchange',
		mailSendRoutingKey: 'routingKey',
		blocklistOfEmailDomains: ['schul-cloud.org', 'example.com'],
		shouldSendEmail: false,
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{ provide: AmqpConnection, useValue: { publish: () => {} } },
				{ provide: MAIL_CONFIG_TOKEN, useValue: mailServiceOptions },
				{ provide: Logger, useValue: createMock<Logger>() },
			],
		}).compile();

		amqpConnection = module.get(AmqpConnection);
		config = module.get(MAIL_CONFIG_TOKEN);
		logger = module.get(Logger);

		service = new MailService(amqpConnection, config, logger);
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
					from: 'noreply@dbildungscloud.de',
				};

				const amqpConnectionSpy = jest.spyOn(amqpConnection, 'publish');

				await service.send(data);

				expect(amqpConnectionSpy).toHaveBeenCalledTimes(0);
			});
		});

		describe('when sending email', () => {
			it('should remove email address that have blacklisted domain and send given data to queue', async () => {
				config.shouldSendEmail = true;
				const data: Mail = {
					mail: { plainTextContent: 'content', subject: 'Test' },
					recipients: ['test@schul-cloud.org', 'test@example1.com', 'test2@schul-cloud.org', 'test3@schul-cloud.org'],
					cc: ['test@example.com', 'test5@schul-cloud.org', 'test6@schul-cloud.org'],
					bcc: ['test7@schul-cloud.org', 'test@example2.com', 'test8@schul-cloud.org'],
					replyTo: ['test@example3.com', 'test9@schul-cloud.org', 'test10@schul-cloud.org'],
					from: 'noreply@dbildungscloud.de',
				};

				const amqpConnectionSpy = jest.spyOn(amqpConnection, 'publish');

				await service.send(data);

				expect(data.recipients).toEqual(['test@example1.com']);
				expect(data.cc).toEqual([]);
				expect(data.bcc).toEqual(['test@example2.com']);
				expect(data.replyTo).toEqual(['test@example3.com']);

				const expectedParams = [
					mailServiceOptions.exchangeName,
					mailServiceOptions.mailSendRoutingKey,
					data,
					{ persistent: true },
				];
				expect(amqpConnectionSpy).toHaveBeenCalledWith(...expectedParams);
			});
		});

		describe('when sending email is disabled', () => {
			it('should log email data instead of sending it', async () => {
				config.shouldSendEmail = false;
				const data: Mail = {
					mail: { plainTextContent: 'content', subject: 'Test' },
					recipients: ['test@test.org'],
					from: 'noreply@dbildungscloud.de',
				};

				const expectedParams = {
					attachments: false,
					plainTextContent: 'content',
					recipients: ['test@test.org'],
					replyTo: '',
					subject: 'Test',
				};

				await service.send(data);

				expect(logger.debug).toHaveBeenCalledTimes(1);
				expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining(expectedParams));
			});
		});
	});
});
