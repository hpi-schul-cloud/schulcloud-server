import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { NodeEnvType } from '@src/server.config';
import { KeycloakManagementController } from './keycloak-management.controller';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

describe('KeycloakManagementController', () => {
	let uc: DeepMocked<KeycloakManagementUc>;
	let controller: KeycloakManagementController;
	let configServiceMock: DeepMocked<ConfigService>;

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
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(KeycloakManagementUc);
		controller = module.get(KeycloakManagementController);
		configServiceMock = module.get(ConfigService);
	});

	beforeEach(() => {
		uc.check.mockResolvedValue(true);
		uc.seed.mockResolvedValue(1);
		uc.configureIdentityProviders.mockResolvedValue(1);
		configServiceMock.get.mockReturnValue(NodeEnvType.TEST);
	});

	afterEach(() => {
		uc.check.mockRestore();
		uc.seed.mockRestore();
		uc.configureIdentityProviders.mockRestore();
		configServiceMock.get.mockRestore();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('importSeedData', () => {
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
	});

	describe('configure', () => {
		it('should accept calls on configure route', async () => {
			await expect(controller.configure()).resolves.not.toThrow();
		});
		it('should not seed users', async () => {
			const result = await controller.configure();
			expect(result).toBeGreaterThan(0);
			expect(uc.check).toBeCalled();
			expect(uc.seed).not.toBeCalled();
			expect(uc.configureIdentityProviders).toBeCalled();
		});
		it('should seed users', async () => {
			configServiceMock.get.mockReturnValueOnce(NodeEnvType.DEVELOPMENT);

			const result = await controller.configure();
			expect(result).toBeGreaterThan(0);
			expect(uc.check).toBeCalled();
			expect(uc.seed).toBeCalled();
			expect(uc.configureIdentityProviders).toBeCalled();
		});
		it('should return -1 if connection is ok but configure fails', async () => {
			uc.configureIdentityProviders.mockRejectedValue('configure failed');

			const result = await controller.configure();
			expect(result).toBe(-1);

			uc.configureIdentityProviders.mockRestore();
		});
		it('should throw if Keycloak is not available', async () => {
			uc.check.mockResolvedValue(false);

			await expect(controller.configure()).rejects.toThrow(ServiceUnavailableException);

			uc.check.mockRestore();
		});
	});
});
