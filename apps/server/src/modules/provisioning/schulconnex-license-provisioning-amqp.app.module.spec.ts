import { Test, TestingModule } from '@nestjs/testing';
import { SchulconnexLicenseProvisioningAMQPModule } from '@modules/provisioning/schulconnex-license-provisioning-amqp.app.module';

describe('SchulconnexLicenseProvisioningAMQPModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [SchulconnexLicenseProvisioningAMQPModule],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined module', () => {
		expect(module).toBeDefined();
	});
});
