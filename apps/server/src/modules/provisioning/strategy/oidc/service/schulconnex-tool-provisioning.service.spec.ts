import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsService, SchulConneXProvisioningOptions } from '@modules/legacy-school';
import { SchulconnexToolProvisioningService } from '@modules/provisioning/strategy/oidc/service/schulconnex-tool-provisioning.service';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { customParameterFactory, externalToolFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { MediaUserLicense, mediaUserLicenseFactory, MediaUserLicenseService } from '@modules/user-license';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolSystemOptionsFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';

describe(SchulconnexToolProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexToolProvisioningService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let mediaUserLicenseService: DeepMocked<MediaUserLicenseService>;
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
					provide: MediaUserLicenseService,
					useValue: createMock<MediaUserLicenseService>(),
				},
				{
					provide: SchoolSystemOptionsService,
					useValue: createMock<SchoolSystemOptionsService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexToolProvisioningService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
		schoolSystemOptionsService = module.get(SchoolSystemOptionsService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionSchoolExternalTool', () => {
		describe('when schoolExternalTool has to be provisioned', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];
				const externalTool: ExternalTool = externalToolFactory.build({
					medium: {
						mediumId: mediaUserLicenses[0].mediumId,
						mediaSourceId: mediaUserLicenses[0].mediaSource?.sourceId,
					},
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
					schoolId,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicenses,
					externalTool,
					schoolExternalTool,
				};
			};

			it('should get provisioning options', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolSystemOptionsService.getProvisioningOptions).toHaveBeenCalledWith(
					SchulConneXProvisioningOptions,
					schoolId,
					systemId
				);
			});

			it('should get media user licenses', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(mediaUserLicenseService.getMediaUserLicensesForUser).toHaveBeenCalledWith(userId);
			});

			it('should get external tool', async () => {
				const { userId, schoolId, systemId, mediaUserLicenses } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(externalToolService.findExternalToolByMedium).toHaveBeenCalledWith(
					mediaUserLicenses[0].mediumId,
					mediaUserLicenses[0].mediaSource?.sourceId
				);
			});

			it('should look for a school external tool', async () => {
				const { userId, schoolId, systemId, externalTool } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
					schoolId,
					toolId: externalTool.id,
				});
			});

			it('should save school external tool', async () => {
				const { userId, schoolId, systemId, externalTool } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith<[SchoolExternalTool]>(
					new SchoolExternalTool({
						id: expect.any(String),
						toolId: externalTool.id,
						isDeactivated: false,
						schoolId,
						parameters: [],
					})
				);
			});
		});

		describe('when schoolExternalToolProvisioningEnabled is false', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];
				const externalTool: ExternalTool = externalToolFactory.build({
					medium: {
						mediumId: mediaUserLicenses[0].mediumId,
						mediaSourceId: mediaUserLicenses[0].mediaSource?.sourceId,
					},
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not save schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when no mediaUserLicenses were found', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const externalTool: ExternalTool = externalToolFactory.build({});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not save schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when no externalTool was found', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(null);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not save schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when tool has non-global parameters', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];
				const externalTool: ExternalTool = externalToolFactory.build({
					medium: {
						mediumId: mediaUserLicenses[0].mediumId,
						mediaSourceId: mediaUserLicenses[0].mediaSource?.sourceId,
					},
					parameters: [customParameterFactory.build()],
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not save schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when schoolExternalTool already exists', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];
				const externalTool: ExternalTool = externalToolFactory.build({
					medium: {
						mediumId: mediaUserLicenses[0].mediumId,
						mediaSourceId: mediaUserLicenses[0].mediaSource?.sourceId,
					},
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
					schoolId,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicenses,
					externalTool,
					schoolExternalTool,
				};
			};

			it('should not save schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});
	});
});
