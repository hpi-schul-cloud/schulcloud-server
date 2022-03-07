import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { AntivirusModule } from './antivirus.module';
import { AntivirusService } from './antivirus.service';

describe('AntivirusModule', () => {
	const antivirusModuleOptions = {
		enabled: false,
		filesServiceBaseUrl: 'http://localhost',
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	it('should be initializable with forRoot', async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [RabbitMQWrapperTestModule, AntivirusModule.forRoot(antivirusModuleOptions)],
		}).compile();

		const antivirusService = module.get(AntivirusService);
		expect(antivirusService).toBeDefined();
	});
});
