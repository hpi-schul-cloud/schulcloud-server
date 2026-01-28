import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { Test, TestingModule } from '@nestjs/testing';
import { MailModule } from './mail.module';
import { MailService } from './mail.service';
import { TEST_MAIL_CONFIG_TOKEN, TestMailConfig } from './testing';

describe('MailModule', () => {
	let module: TestingModule;
	let mailService: MailService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MailModule.register({
					exchangeConfigConstructor: TestMailConfig,
					exchangeConfigInjectionToken: TEST_MAIL_CONFIG_TOKEN,
					configInjectionToken: RABBITMQ_CONFIG_TOKEN,
					configConstructor: RabbitMQConfig,
				}),
			],
		}).compile();

		mailService = module.get(MailService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be initializable with forRoot', () => {
		expect(mailService).toBeDefined();
	});
});
