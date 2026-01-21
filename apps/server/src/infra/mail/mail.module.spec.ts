import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { Test, TestingModule } from '@nestjs/testing';
import { MailModule } from './mail.module';
import { MailService } from './mail.service';
import { TestMailConfig, TEST_MAIL_CONFIG_TOKEN } from './testing';

describe('MailModule', () => {
	let module: TestingModule;
	let mailService: MailService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [RabbitMQWrapperTestModule, MailModule.register(TestMailConfig, TEST_MAIL_CONFIG_TOKEN)],
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
