import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolSystemOptionsService } from '@modules/legacy-school';
import { SchulconnexToolProvisioningService } from '@modules/provisioning/strategy/oidc/service/schulconnex-tool-provisioning.service';
import { ExternalToolService } from '@modules/tool';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { UserLicenseService } from '@modules/user-license';
import { Test, TestingModule } from '@nestjs/testing';

describe(SchulconnexToolProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexToolProvisioningService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let userLicenseService: DeepMocked<UserLicenseService>;
	let schoolSystemOptionsService: DeepMocked<SchoolSystemOptionsService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexToolProvisioningService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: UserLicenseService,
					useValue: createMock<UserLicenseService>(),
				},
				{
					provide: SchoolSystemOptionsService,
					useValue: createMock<SchoolSystemOptionsService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexToolProvisioningService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		schoolSystemOptionsService = module.get(SchoolSystemOptionsService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('provisionSchoolExternalTool', () => {
		describe('when schoolExternalTool has to be provisioned', () => {
			const setup = () => {};

			it('should get provisioning options', async () => {});

			it('should get media user licenses', async () => {});

			it('should get external tool', async () => {});

			it('should not find a school external tool', async () => {});

			it('should save school external tool', async () => {});
		});

		describe('when schoolExternalToolProvisioningEnabled is false', () => {
			const setup = () => {};

			it('should not save schoolExternalTool', async () => {});
		});
		// do we need this?
		describe('when no mediauserLicenses were found', () => {
			const setup = () => {};

			it('should not save schoolExternalTool', async () => {});
		});

		describe('when no externalTool was found', () => {
			const setup = () => {};

			it('should not save schoolExternalTool', async () => {});
		});

		describe('when tool has non-global parameters', () => {
			const setup = () => {};

			it('should not save schoolExternalTool', async () => {});
		});

		describe('when schoolExternalTool already exists', () => {
			const setup = () => {};

			it('should not save schoolExternalTool', async () => {});
		});
	});
});
