import { Configuration } from '@hpi-schul-cloud/commons';
import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { MailModule } from './mail.module';
import { MailService } from './mail.service';

describe('MailModule', () => {
	let module: TestingModule;
	const mailModuleOptions = {
		uri: Configuration.get('RABBITMQ_URI') as string,
		exchange: 'exchange',
		routingKey: 'routingKey',
	};
	let mailService: MailService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [RabbitMQWrapperTestModule, MailModule.forRoot(mailModuleOptions)],
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
