import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EnvType } from '@shared/infra/identity-management';
import { KeycloakManagementController } from './keycloak-management.controller';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

describe('KeycloakManagementController', () => {
	let uc: DeepMocked<KeycloakManagementUc>;
	let controller: KeycloakManagementController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [KeycloakManagementController],
			providers: [
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: KeycloakManagementUc,
					useValue: createMock<KeycloakManagementUc>(),
				},
			],
		}).compile();

		uc = module.get(KeycloakManagementUc);
		controller = module.get(KeycloakManagementController);
	});

	beforeEach(() => {
		uc.check.mockResolvedValue(true);
		uc.seed.mockResolvedValue(1);
		uc.configure.mockResolvedValue(1);
	});

	afterEach(() => {
		uc.check.mockRestore();
		uc.seed.mockRestore();
		uc.configure.mockRestore();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
	it('should accept calls on seed route', async () => {
		const received = await controller.importSeedData();
		expect(received).toBe(1);
	});
	it('should return -1 if connection ok but seed fails', async () => {
		uc.seed.mockRejectedValue('seeding error');

		const received = await controller.importSeedData();
		expect(received).toBe(-1);

		uc.seed.mockRestore();
	});
	it('should throw if connection fails', async () => {
		uc.check.mockResolvedValue(false);
		uc.seed.mockRejectedValue('seeding error');

		await expect(controller.importSeedData()).rejects.toThrow(ServiceUnavailableException);

		uc.check.mockRestore();
		uc.seed.mockRestore();
	});
	it('should accept calls on configure route', async () => {
		const result = await controller.applyConfiguration();
		expect(result).toBe(1);
	});
	it('should return -1 if connection is ok but configure fails', async () => {
		uc.configure.mockRejectedValue('configure failed');

		const result = await controller.applyConfiguration('unknown' as EnvType);
		expect(result).toBe(-1);

		uc.configure.mockRestore();
	});
});
