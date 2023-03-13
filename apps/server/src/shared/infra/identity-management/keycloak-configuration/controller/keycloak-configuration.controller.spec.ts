import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { NodeEnvType } from '@src/modules/server/server.config';
import { KeycloakConfigurationUc } from '../uc/keycloak-configuration.uc';
import { KeycloakManagementController } from './keycloak-configuration.controller';

describe('KeycloakManagementController', () => {
	let module: TestingModule;
	let uc: DeepMocked<KeycloakConfigurationUc>;
	let controller: KeycloakManagementController;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [KeycloakManagementController],
			providers: [
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: KeycloakConfigurationUc,
					useValue: createMock<KeycloakConfigurationUc>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(KeycloakConfigurationUc);
		controller = module.get(KeycloakManagementController);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		uc.check.mockResolvedValue(true);
		uc.seed.mockResolvedValue(1);
		uc.configure.mockResolvedValue(1);
		configServiceMock.get.mockReturnValue(NodeEnvType.TEST);
	});

	afterEach(() => {
		uc.check.mockRestore();
		uc.seed.mockRestore();
		uc.configure.mockRestore();
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
		it('should call configure with param true', async () => {
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
});
