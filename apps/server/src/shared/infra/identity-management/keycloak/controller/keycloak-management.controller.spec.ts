import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { KeycloakManagementController } from './keycloak-management.controller';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

describe('KeycloakManagementController', () => {
	let uc: KeycloakManagementUc;
	let controller: KeycloakManagementController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [KeycloakManagementController],
			providers: [
				{
					provide: KeycloakManagementUc,
					useValue: {
						check: jest.fn(),
						seed: jest.fn(),
					},
				},
			],
		}).compile();

		uc = module.get(KeycloakManagementUc);
		controller = module.get(KeycloakManagementController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should accept calls on seed route', async () => {
		const expected = 10;
		jest.spyOn(uc, 'check').mockResolvedValue(true);
		jest.spyOn(uc, 'seed').mockResolvedValue(expected);
		const received = await controller.importSeedData();
		expect(received).toBe(expected);
	});

	it('should return -1 if connection ok but seed fails', async () => {
		jest.spyOn(uc, 'check').mockResolvedValue(true);
		jest.spyOn(uc, 'seed').mockRejectedValue('seeding error');
		const received = await controller.importSeedData();
		expect(received).toBe(-1);
	});

	it('should throw if connection fails', async () => {
		jest.spyOn(uc, 'check').mockResolvedValue(false);
		jest.spyOn(uc, 'seed').mockRejectedValue('seeding error');
		await expect(controller.importSeedData()).rejects.toThrow(ServiceUnavailableException);
	});
});
