import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { SchulConneXProvisioningOptions } from '../domain';
import { ProvisioningOptionsUpdateService } from './provisioning-options-update.service';
import { SchulconnexProvisioningOptionsUpdateService } from './schulconnex-provisioning-options-update.service';

describe(ProvisioningOptionsUpdateService.name, () => {
	let module: TestingModule;
	let service: ProvisioningOptionsUpdateService;

	let schulconnexProvisioningOptionsUpdateService: DeepMocked<SchulconnexProvisioningOptionsUpdateService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ProvisioningOptionsUpdateService,
				{
					provide: SchulconnexProvisioningOptionsUpdateService,
					useValue: createMock<SchulconnexProvisioningOptionsUpdateService>(),
				},
			],
		}).compile();

		service = module.get(ProvisioningOptionsUpdateService);
		schulconnexProvisioningOptionsUpdateService = module.get(SchulconnexProvisioningOptionsUpdateService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handleUpdate', () => {
		describe('when the options are of type schulconnex', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();
				const provisioningOptions: SchulConneXProvisioningOptions = new SchulConneXProvisioningOptions();

				return {
					schoolId,
					systemId,
					provisioningOptions,
				};
			};

			it('should execute the schulconnex service', async () => {
				const { schoolId, systemId, provisioningOptions } = setup();

				await service.handleUpdate(schoolId, systemId, provisioningOptions, provisioningOptions);

				expect(schulconnexProvisioningOptionsUpdateService.handleUpdate).toHaveBeenCalledWith(
					schoolId,
					systemId,
					provisioningOptions,
					provisioningOptions
				);
			});
		});
	});
});
