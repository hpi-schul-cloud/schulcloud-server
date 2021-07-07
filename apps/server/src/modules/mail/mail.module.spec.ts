import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { Configuration } from '@hpi-schul-cloud/commons';

import { MailModule } from './mail.module';

describe('MailModule', () => {

	const mailModuleOptions = {
        uri: Configuration.get('RABBITMQ_URI'),
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	it('should be initializable with forRoot', async () => {
		const module: TestingModule = await Test.createTestingModule({
            imports: [MailModule.forRoot(mailModuleOptions)],
		}).compile();

        const mailService = module.get(MailService);
		expect(mailService).toBeDefined();
	});
});

