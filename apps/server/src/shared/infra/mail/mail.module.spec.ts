import { Configuration } from '@hpi-schul-cloud/commons';
import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { MailModule } from './mail.module';
import { MailService } from './mail.service';

describe('MailModule', () => {
	const mailModuleOptions = {
		uri: Configuration.get('RABBITMQ_URI') as string,
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	it('should be initializable with forRoot', async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [RabbitMQWrapperTestModule, MailModule.forRoot(mailModuleOptions)],
		}).compile();

		const mailService = module.get(MailService);
		expect(mailService).toBeDefined();
	});
});
