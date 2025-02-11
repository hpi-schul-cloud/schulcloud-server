import { Test, TestingModule } from '@nestjs/testing';
import { SchulconnexGroupProvisioningAMQPModule } from '@modules/provisioning/schulconnex-group-provisioning-amqp.app.module';

describe('SchulconnexGroupProvisioningAMQPModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [SchulconnexGroupProvisioningAMQPModule],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined module', () => {
		expect(module).toBeDefined();
	});
});
