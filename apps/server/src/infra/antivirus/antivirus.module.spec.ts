import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQWrapperTestModule } from '../rabbitmq';
import { AntivirusModule } from './antivirus.module';
import { AntivirusService } from './antivirus.service';

describe('AntivirusModule', () => {
	let module: TestingModule;
	let antivirusService: AntivirusService;
	const antivirusModuleOptions = {
		enabled: false,
		filesServiceBaseUrl: 'http://localhost',
		exchange: 'exchange',
		routingKey: 'routingKey',
		hostname: 'localhost',
		port: 3311,
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [RabbitMQWrapperTestModule, AntivirusModule.forRoot(antivirusModuleOptions)],
		}).compile();
		antivirusService = module.get(AntivirusService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be initializable with forRoot', () => {
		expect(antivirusService).toBeDefined();
	});
});
