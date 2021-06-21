import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailModule } from './mail.module';

describe('MailService', () => {
	let service: MailService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MailModule, MailService],
		}).compile();

		service = module.get<MailService>(MailService);
	});

	it('should be defined', async () => {
		expect(service).toBeDefined();
	});

	it('test', async () => {
		await service.send('test', {hello: 'world'});
	});
});
