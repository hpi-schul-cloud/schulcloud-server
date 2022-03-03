import { Configuration } from '@hpi-schul-cloud/commons';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonTestModule } from '@src/common.module';
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
			imports: [CommonTestModule, MailModule.forRoot(mailModuleOptions)],
		}).compile();

		const mailService = module.get(MailService);
		expect(mailService).toBeDefined();
	});
});
