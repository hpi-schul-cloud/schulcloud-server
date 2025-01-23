import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaBoardConfig } from '@modules/board/media-board.config';
import { MediaSchoolLicense } from '@modules/school-license';
import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { mediaSchoolLicenseFactory } from '@modules/school-license/testing';
import { UserService } from '@modules/user';
import { MediaUserLicense, mediaUserLicenseFactory, MediaUserLicenseService } from '@modules/user-license';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { UserDO } from '@shared/domain/domainobject';
import { userDoFactory } from '@testing/factory/user.do.factory';
import { ToolConfig } from '../..';
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
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let userService: DeepMocked<UserService>;

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
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		service = module.get(ToolConfigurationStatusService);
		commonToolValidationService = module.get(CommonToolValidationService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		userService = module.get(UserService);

		configService = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	describe('determineToolConfigurationStatus', () => {
		describe('determineToolConfigurationStatus whithout media license activations', () => {
			beforeEach(() => {
				const config: Partial<ToolConfig> = {
					FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: false,
					FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: false,
				};
				configService.get.mockImplementation((key: keyof Partial<ToolConfig>) => config[key]);
			});

			describe('when validation runs through', () => {
				const setup = () => {
					const userId: string = new ObjectId().toHexString();

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });

					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id)
						.buildWithId();

					commonToolValidationService.validateParameters.mockReturnValue([]);
					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(
						externalTool,
						contextExternalTool
					);
				});
			});

			describe('when validation of SchoolExternalTool throws an error', () => {
				const setup = () => {
					const userId: string = new ObjectId().toHexString();

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id)
						.buildWithId();

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(
						externalTool,
						contextExternalTool
					);
				});
			});

			describe('when validation of ContextExternalTool throws an error', () => {
				const setup = () => {
					const userId: string = new ObjectId().toHexString();

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id)
						.buildWithId();

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(
						externalTool,
						contextExternalTool
					);
				});
			});

			describe('when validation of SchoolExternalTool and ContextExternalTool throws an error', () => {
				const setup = () => {
					const userId: string = new ObjectId().toHexString();

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id)
						.buildWithId();

					commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
					commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(
						externalTool,
						contextExternalTool
					);
				});
			});

			describe('when validation of ContextExternalTool throws at least 1 missing value on mandatory parameter errors', () => {
				const setup = () => {
					const userId: string = new ObjectId().toHexString();

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
					const customParameter = customParameterFactory.build();
					const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id)
						.buildWithId();

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
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

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
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

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
						isDeactivated: true,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id)
						.buildWithId();

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

					const schoolId = new ObjectId().toHexString();
					const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
					const externalTool = externalToolFactory.buildWithId({ isDeactivated: true });
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id)
						.buildWithId();

					commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
					commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

					userService.findById.mockResolvedValueOnce(user);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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
		});

		describe('determineToolConfigurationStatus with media license activations', () => {
			describe('determineToolConfigurationStatus with FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED', () => {
				beforeEach(() => {
					const config: Partial<ToolConfig> = {
						FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: true,
						FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: false,
					};
					configService.get.mockImplementation((key: keyof Partial<ToolConfig>) => config[key]);
				});
				describe('when license feature is enabled and user has no license for externalTool', () => {
					const setup = () => {
						const userId: string = new ObjectId().toHexString();

						const schoolId = new ObjectId().toHexString();
						const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
						userService.findById.mockResolvedValueOnce(user);

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
						userService.findById.mockResolvedValueOnce(user);
						mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
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

						await service.determineToolConfigurationStatus(
							externalTool,
							schoolExternalTool,
							contextExternalTool,
							userId
						);

						expect(mediaUserLicenseService.getMediaUserLicensesForUser).toHaveBeenCalledWith(userId);
					});

					it('should check if user has license for external tool', async () => {
						const { externalTool, schoolExternalTool, contextExternalTool, userId, mediaUserLicense } = setup();

						await service.determineToolConfigurationStatus(
							externalTool,
							schoolExternalTool,
							contextExternalTool,
							userId
						);

						expect(mediaUserLicenseService.hasLicenseForExternalTool).toHaveBeenCalledWith(externalTool.medium, [
							mediaUserLicense,
						]);
					});
				});
			});
			describe('determineToolConfigurationStatus with FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED media license activations', () => {
				beforeEach(() => {
					const config: Partial<ToolConfig> = {
						FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: false,
						FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: true,
					};
					configService.get.mockImplementation((key: keyof Partial<ToolConfig>) => config[key]);
				});
				describe('when license feature is enabled and user school has no license for externalTool', () => {
					const setup = () => {
						const userId: string = new ObjectId().toHexString();

						const schoolId = new ObjectId().toHexString();
						const user: UserDO = userDoFactory.buildWithId({ id: userId, schoolId });
						userService.findById.mockResolvedValueOnce(user);

						const externalTool = externalToolFactory.withMedium().buildWithId();
						const schoolExternalTool = schoolExternalToolFactory.buildWithId({
							toolId: externalTool.id,
						});
						const contextExternalTool = contextExternalToolFactory
							.withSchoolExternalToolRef(schoolExternalTool.id)
							.buildWithId();
						const mediaSchoolLicense: MediaSchoolLicense = mediaSchoolLicenseFactory.build();

						commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
						commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
						mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
						userService.findById.mockResolvedValueOnce(user);
						mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([mediaSchoolLicense]);

						return {
							externalTool,
							schoolExternalTool,
							contextExternalTool,
							userId,
							schoolId,
							mediaSchoolLicense,
						};
					};

					it('should get the MediaSchoolLicense for user school', async () => {
						const { externalTool, schoolExternalTool, contextExternalTool, userId, schoolId } = setup();

						await service.determineToolConfigurationStatus(
							externalTool,
							schoolExternalTool,
							contextExternalTool,
							userId
						);

						expect(mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId).toHaveBeenCalledWith(schoolId);
					});

					it('should check if user school has license for external tool', async () => {
						const { externalTool, schoolExternalTool, contextExternalTool, userId, mediaSchoolLicense } = setup();

						await service.determineToolConfigurationStatus(
							externalTool,
							schoolExternalTool,
							contextExternalTool,
							userId
						);

						expect(mediaSchoolLicenseService.hasLicenseForExternalTool).toHaveBeenCalledWith(externalTool.medium, [
							mediaSchoolLicense,
						]);
					});
				});
			});
		});
	});
});
