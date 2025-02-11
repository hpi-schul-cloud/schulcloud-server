import { Test, TestingModule } from '@nestjs/testing';
import { SchulconnexGroupRemovalAMQPModule } from '@modules/provisioning/schulconnex-group-removal-amqp.app.module';

describe('SchulconnexGroupRemovalAMQPModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [SchulconnexGroupRemovalAMQPModule],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined module', () => {
		expect(module).toBeDefined();
	});
});
