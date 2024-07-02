import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaBoardConfig } from '@modules/board/media-board.config';
import { MediaUserLicense, mediaUserLicenseFactory, MediaUserLicenseService } from '@modules/user-license';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterDuplicateLoggableException,
	ToolParameterMandatoryValueMissingLoggableException,
	ToolParameterOptionalValueMissingLoggableException,
} from '../../common/domain';
import { CommonToolValidationService } from '../../common/service';
import { customParameterFactory, externalToolFactory } from '../../external-tool/testing';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { contextExternalToolFactory } from '../testing';
import { ToolConfigurationStatusService } from './tool-configuration-status.service';

describe(ToolConfigurationStatusService.name, () => {
	let module: TestingModule;
	let service: ToolConfigurationStatusService;

	let commonToolValidationService: DeepMocked<CommonToolValidationService>;
	let mediaUserLicenseService: DeepMocked<MediaUserLicenseService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolConfigurationStatusService,
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
				{
					provide: MediaUserLicenseService,
					useValue: createMock<MediaUserLicenseService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(ToolConfigurationStatusService);
		commonToolValidationService = module.get(CommonToolValidationService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
		configService = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('determineToolConfigurationStatus', () => {
		describe('when validation runs through', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValue([]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return latest tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
					isNotLicensed: false,
				});
			});

			it('should validate the school external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
			});
		});

		describe('when validation of SchoolExternalTool throws an error', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return outdated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
					isNotLicensed: false,
				});
			});

			it('should validate the school external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
			});
		});

		describe('when validation of ContextExternalTool throws an error', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return outdated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
					isNotLicensed: false,
				});
			});

			it('should validate the school external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
			});
		});

		describe('when validation of SchoolExternalTool and ContextExternalTool throws an error', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return outdated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
					isNotLicensed: false,
				});
			});

			it('should validate the school external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
			});
		});

		describe('when validation of ContextExternalTool throws at least 1 missing value on mandatory parameter errors', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const customParameter = customParameterFactory.build();
				const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([
					new ToolParameterMandatoryValueMissingLoggableException(undefined, customParameter),
					new ToolParameterDuplicateLoggableException(undefined, customParameter.name),
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
				]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return incomplete as tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: true,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
					isNotLicensed: false,
				});
			});
		});

		describe('when validation of ContextExternalTool throws at least 1 missing value on optional parameter errors', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const customParameter = customParameterFactory.build();
				const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
					new ToolParameterDuplicateLoggableException(undefined, customParameter.name),
				]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return incomplete operational as tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: true,
					isDeactivated: false,
					isNotLicensed: false,
				});
			});
		});

		describe('when validation of ContextExternalTool throws only missing value on optional parameter errors', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const customParameter = customParameterFactory.build();
				const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
				]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return incomplete operational as tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: true,
					isDeactivated: false,
					isNotLicensed: false,
				});
			});
		});

		describe('when SchoolExternalTool is deactivated', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					isDeactivated: true,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return status is deactivated', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: true,
					isNotLicensed: false,
				});
			});
		});

		describe('when externalTool is deactivated', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId({ isDeactivated: true });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
				};
			};

			it('should return deactivated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: true,
					isNotLicensed: false,
				});
			});
		});

		describe('when license feature is enabled and user has no license for externalTool', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(true);

				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.withMedium().buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();
				const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build();

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([mediaUserLicense]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId,
					mediaUserLicense,
				};
			};

			it('should get the mediaUserLicenses for user', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(mediaUserLicenseService.getMediaUserLicensesForUser).toHaveBeenCalledWith(userId);
			});

			it('should check if user has license for external tool', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId, mediaUserLicense } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool, userId);

				expect(mediaUserLicenseService.hasLicenseForExternalTool).toHaveBeenCalledWith(externalTool.medium, [
					mediaUserLicense,
				]);
			});

			it('should return not licensed tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
					isNotLicensed: true,
				});
			});
		});
	});
});
