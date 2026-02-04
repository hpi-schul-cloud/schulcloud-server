import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { School, SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject/page';
import { IFindOptions, Permission, SortOrder } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { CustomParameter } from '../../common/domain';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../common/enum';
import { ExternalToolSearchQuery } from '../../common/interface';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { TOOL_CONFIG_TOKEN } from '../../tool-config';
import {
	ExternalTool,
	ExternalToolDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateProperty,
	ExternalToolProps,
	Lti11ToolConfig,
	Oauth2ToolConfig,
} from '../domain';
import {
	DatasheetPdfService,
	ExternalToolImageService,
	ExternalToolLogoService,
	ExternalToolService,
	ExternalToolValidationService,
} from '../service';
import {
	customParameterFactory,
	externalToolDatasheetTemplateDataFactory,
	externalToolFactory,
	fileRecordRefFactory,
	lti11ToolConfigFactory,
	oauth2ToolConfigFactory,
} from '../testing';
import { ExternalToolCreate, ExternalToolImportResult, ExternalToolUpdate, Lti11ToolConfigUpdate } from './dto';
import { ExternalToolUc } from './external-tool.uc';

describe(ExternalToolUc.name, () => {
	let module: TestingModule;
	let uc: ExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let schoolService: DeepMocked<SchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let toolValidationService: DeepMocked<ExternalToolValidationService>;
	let logoService: DeepMocked<ExternalToolLogoService>;
	let pdfService: DeepMocked<DatasheetPdfService>;
	let externalToolImageService: DeepMocked<ExternalToolImageService>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				ExternalToolUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: DatasheetPdfService,
					useValue: createMock<DatasheetPdfService>(),
				},
				{
					provide: ExternalToolImageService,
					useValue: createMock<ExternalToolImageService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: TOOL_CONFIG_TOKEN,
					useValue: {
						scTitle: 'dBildungscloud',
					},
				},
			],
		}).compile();

		uc = module.get(ExternalToolUc);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		schoolService = module.get(SchoolService);
		authorizationService = module.get(AuthorizationService);
		toolValidationService = module.get(ExternalToolValidationService);
		logoService = module.get(ExternalToolLogoService);
		pdfService = module.get(DatasheetPdfService);
		externalToolImageService = module.get(ExternalToolImageService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupAuthorization = () => {
		const user: User = userFactory.buildWithId();
		const currentUser = currentUserFactory.build();

		authorizationService.getUserWithPermissions.mockResolvedValue(user);

		return {
			user,
			currentUser,
		};
	};

	const setupDefault = () => {
		const toolId = 'toolId';
		const mockLogoBase64 = 'base64LogoString';

		const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).buildWithId();
		const oauth2ConfigWithoutExternalData: Oauth2ToolConfig = oauth2ToolConfigFactory.build();
		const lti11ToolConfig: Lti11ToolConfig = lti11ToolConfigFactory.build();

		const query: ExternalToolSearchQuery = {
			name: externalTool.name,
		};
		const options: IFindOptions<ExternalTool> = {
			order: {
				id: SortOrder.asc,
				name: SortOrder.asc,
			},
			pagination: {
				limit: 2,
				skip: 1,
			},
		};
		const page: Page<ExternalTool> = new Page<ExternalTool>(
			[externalToolFactory.build({ ...externalTool, config: oauth2ConfigWithoutExternalData })],
			1
		);

		externalToolService.createExternalTool.mockResolvedValueOnce(externalTool);
		externalToolService.findExternalTools.mockResolvedValueOnce(page);
		logoService.fetchLogo.mockResolvedValueOnce(mockLogoBase64);

		return {
			externalTool,
			oauth2ConfigWithoutExternalData,
			options,
			page,
			query,
			toolId,
			mockLogoBase64,
			lti11ToolConfig,
		};
	};

	describe('createExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { externalTool } = setupDefault();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { externalTool } = setupDefault();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to create an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { externalTool } = setupDefault();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.createExternalTool(currentUser.userId, externalTool);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should validate the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool, mockLogoBase64 } = setupDefault();

			await uc.createExternalTool(currentUser.userId, externalTool.getProps());

			expect(toolValidationService.validateCreate).toHaveBeenCalledWith(
				new ExternalTool({
					...externalTool.getProps(),
					logo: mockLogoBase64,
					id: expect.any(String),
				})
			);
		});

		it('should throw if validation of the tool fails', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setupDefault();
			toolValidationService.validateCreate.mockImplementation(() => {
				throw new UnprocessableEntityException();
			});

			const result: Promise<ExternalTool> = uc.createExternalTool(currentUser.userId, externalTool.getProps());

			await expect(result).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call the service to save a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool, mockLogoBase64 } = setupDefault();

			await uc.createExternalTool(currentUser.userId, externalTool.getProps());

			expect(externalToolService.createExternalTool).toHaveBeenCalledWith(
				new ExternalTool({
					...externalTool.getProps(),
					logo: mockLogoBase64,
					id: expect.any(String),
				})
			);
		});

		it('should return saved a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setupDefault();

			const result: ExternalTool = await uc.createExternalTool(currentUser.userId, externalTool.getProps());

			expect(result).toEqual(externalTool);
		});

		describe('when fetching logo', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					currentUser,
					externalTool,
				};
			};

			it('should call ExternalToolLogoService', async () => {
				const { currentUser, externalTool } = setup();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(logoService.fetchLogo).toHaveBeenCalledWith(
					expect.objectContaining<ExternalToolProps>({ ...externalTool.getProps(), id: expect.any(String) })
				);
			});
		});

		describe('when thumbnail url is given', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				const externalTool: ExternalToolCreate = {
					...externalToolFactory.buildWithId().getProps(),
					thumbnailUrl: 'https://thumbnail.url',
				};

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				const savedExternalTool = new ExternalTool({ ...externalTool, id: new ObjectId().toHexString() });
				externalToolService.createExternalTool.mockResolvedValueOnce(savedExternalTool);
				const thumbnailFileRecordRef = fileRecordRefFactory.build();
				externalToolImageService.uploadImageFileFromUrl.mockResolvedValueOnce(thumbnailFileRecordRef);

				return {
					currentUser,
					externalTool,
					savedExternalTool,
					thumbnailFileRecordRef,
				};
			};

			it('should call external tool image service', async () => {
				const { currentUser, externalTool, savedExternalTool } = setup();

				await uc.createExternalTool(currentUser.userId, externalTool);

				expect(externalToolImageService.uploadImageFileFromUrl).toHaveBeenCalledWith(
					externalTool.thumbnailUrl,
					ExternalTool.thumbnailNameAffix,
					savedExternalTool.id
				);
			});

			it('should update external tool with thumbnail file record', async () => {
				const { currentUser, externalTool, thumbnailFileRecordRef } = setup();

				await uc.createExternalTool(currentUser.userId, externalTool);

				expect(externalToolService.updateExternalTool).toHaveBeenCalledWith(
					expect.objectContaining<Partial<ExternalTool>>({ thumbnail: thumbnailFileRecordRef })
				);
			});
		});

		describe('when external tool with lti11 config is given', () => {
			const setupLTI = () => {
				const { currentUser } = setupAuthorization();
				const { externalTool, lti11ToolConfig } = setupDefault();
				externalTool.config = lti11ToolConfig;

				encryptionService.encrypt.mockReturnValue('encrypted');

				return {
					currentUser,
					externalTool,
				};
			};
			it('should call the encryption service', async () => {
				const { currentUser, externalTool } = setupLTI();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(encryptionService.encrypt).toHaveBeenCalledWith('secret');
			});

			it('should call the service to save a tool', async () => {
				const { currentUser, externalTool } = setupLTI();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(externalToolService.createExternalTool).toHaveBeenNthCalledWith(
					1,
					new ExternalTool({
						...externalTool.getProps(),
						logo: 'base64LogoString',
						config: { ...externalTool.config, secret: 'encrypted' },
						id: expect.any(String),
					})
				);
			});
		});
	});

	describe('importExternalTools', () => {
		describe('when importing multiple external tools', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const externalTool1 = externalToolFactory.build({
					name: 'tool1',
					medium: {
						mediumId: 'medium1',
						mediaSourceId: 'mediumSource1',
					},
				});
				const externalToolCreate1: ExternalToolCreate = {
					...externalTool1.getProps(),
					thumbnailUrl: 'https://thumbnail.url1',
				};
				const externalTool2 = externalToolFactory.build({
					name: 'tool2',
					medium: {
						mediumId: 'medium2',
						mediaSourceId: 'mediumSource2',
					},
				});
				const externalToolCreate2: ExternalToolCreate = {
					...externalTool2.getProps(),
					thumbnailUrl: 'https://thumbnail.url2',
				};

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				logoService.fetchLogo.mockResolvedValueOnce(undefined);
				const thumbnailFileRecordRef = fileRecordRefFactory.build();
				externalToolImageService.uploadImageFileFromUrl.mockResolvedValueOnce(thumbnailFileRecordRef);
				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool1);
				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool2);

				return {
					user,
					externalTool1,
					externalToolCreate1,
					externalTool2,
					externalToolCreate2,
					thumbnailFileRecordRef,
				};
			};

			it('should not call encryption service', async () => {
				const { user, externalTool1, externalTool2 } = setup();

				await uc.importExternalTools(user.id, [externalTool1.getProps(), externalTool2.getProps()]);

				expect(encryptionService.encrypt).not.toHaveBeenCalled();
			});

			it('should check the users permission', async () => {
				const { user, externalTool1, externalTool2 } = setup();

				await uc.importExternalTools(user.id, [externalTool1.getProps(), externalTool2.getProps()]);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should validate each tool', async () => {
				const { user, externalTool1, externalTool2 } = setup();

				await uc.importExternalTools(user.id, [externalTool1.getProps(), externalTool2.getProps()]);

				expect(toolValidationService.validateCreate).toHaveBeenNthCalledWith(
					1,
					new ExternalTool({
						...externalTool1.getProps(),
						id: expect.any(String),
					})
				);
				expect(toolValidationService.validateCreate).toHaveBeenNthCalledWith(
					2,
					new ExternalTool({
						...externalTool2.getProps(),
						id: expect.any(String),
					})
				);
			});

			it('should save each tool', async () => {
				const { user, externalTool1, externalTool2 } = setup();

				await uc.importExternalTools(user.id, [externalTool1.getProps(), externalTool2.getProps()]);

				expect(externalToolService.createExternalTool).toHaveBeenNthCalledWith(
					1,
					new ExternalTool({
						...externalTool1.getProps(),
						id: expect.any(String),
					})
				);
				expect(externalToolService.createExternalTool).toHaveBeenNthCalledWith(
					2,
					new ExternalTool({
						...externalTool2.getProps(),
						id: expect.any(String),
					})
				);
			});

			it('should return a result report', async () => {
				const { user, externalTool1, externalTool2 } = setup();

				const result = await uc.importExternalTools(user.id, [externalTool1.getProps(), externalTool2.getProps()]);

				expect(result).toEqual<ExternalToolImportResult[]>([
					{
						toolName: externalTool1.name,
						mediumId: externalTool1.medium?.mediumId,
						mediumSourceId: externalTool1.medium?.mediaSourceId,
						toolId: externalTool1.id,
					},
					{
						toolName: externalTool2.name,
						mediumId: externalTool2.medium?.mediumId,
						mediumSourceId: externalTool2.medium?.mediaSourceId,
						toolId: externalTool2.id,
					},
				]);
			});

			it('should save thumbnails for each tool', async () => {
				const { user, externalTool1, externalToolCreate1, externalTool2, externalToolCreate2 } = setup();

				await uc.importExternalTools(user.id, [externalToolCreate1, externalToolCreate2]);

				expect(externalToolImageService.uploadImageFileFromUrl).toHaveBeenCalledWith(
					externalToolCreate1.thumbnailUrl,
					ExternalTool.thumbnailNameAffix,
					externalTool1.id
				);
				expect(externalToolImageService.uploadImageFileFromUrl).toHaveBeenCalledWith(
					externalToolCreate2.thumbnailUrl,
					ExternalTool.thumbnailNameAffix,
					externalTool2.id
				);
			});
		});

		describe('when importing lti tool', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const externalTool1 = externalToolFactory.build({
					name: 'tool1',
					medium: {
						mediumId: 'medium1',
						mediaSourceId: 'mediumSource1',
					},
				});

				const ltiConfig = lti11ToolConfigFactory.build();
				externalTool1.config = ltiConfig;

				const externalToolCreate1: ExternalToolCreate = {
					...externalTool1.getProps(),
					thumbnailUrl: 'https://thumbnail.url1',
				};

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				logoService.fetchLogo.mockResolvedValueOnce(undefined);
				const thumbnailFileRecordRef = fileRecordRefFactory.build();
				externalToolImageService.uploadImageFileFromUrl.mockResolvedValueOnce(thumbnailFileRecordRef);
				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool1);
				encryptionService.encrypt.mockReturnValue('encrypted');

				return {
					user,
					externalTool1,
					externalToolCreate1,
					thumbnailFileRecordRef,
				};
			};

			it('should call encryption service', async () => {
				const { user, externalTool1 } = setup();

				await uc.importExternalTools(user.id, [externalTool1.getProps()]);

				expect(encryptionService.encrypt).toHaveBeenCalled();
			});

			it('should save tool', async () => {
				const { user, externalTool1 } = setup();

				await uc.importExternalTools(user.id, [externalTool1.getProps()]);

				expect(externalToolService.createExternalTool).toHaveBeenNthCalledWith(
					1,
					new ExternalTool({
						...externalTool1.getProps(),
						config: lti11ToolConfigFactory.build({ ...externalTool1.config, secret: 'encrypted' }),
						id: expect.any(String),
					})
				);
			});
		});

		describe('when an external tools fails the validation', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const externalTool1 = externalToolFactory.build({
					name: 'tool1',
					medium: {
						mediumId: 'medium1',
						mediaSourceId: 'mediumSource1',
					},
				});
				const externalTool2 = externalToolFactory.build({
					name: 'tool1',
					medium: {
						mediumId: 'medium2',
						mediaSourceId: 'mediumSource2',
					},
				});
				const error = new Error('same tool name');

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				logoService.fetchLogo.mockResolvedValueOnce(undefined);
				toolValidationService.validateCreate.mockResolvedValueOnce();
				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool1);
				toolValidationService.validateCreate.mockRejectedValueOnce(error);

				return {
					user,
					externalTool1,
					externalTool2,
					error,
				};
			};

			it('should return an error in the result report', async () => {
				const { user, externalTool1, externalTool2, error } = setup();

				const results = await uc.importExternalTools(user.id, [externalTool1.getProps(), externalTool2.getProps()]);

				expect(results).toHaveLength(2);
				expect(results[1]).toEqual<ExternalToolImportResult>({
					toolName: externalTool2.name,
					mediumId: externalTool2.medium?.mediumId,
					mediumSourceId: externalTool2.medium?.mediaSourceId,
					toolId: undefined,
					error: error.message,
				});
			});
		});
	});

	describe('findExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { query, options } = setupDefault();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { query, options } = setupDefault();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to find an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { query, options } = setupDefault();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<Page<ExternalTool>> = uc.findExternalTool(currentUser.userId, query, options);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should call the externalToolService', async () => {
			const { currentUser } = setupAuthorization();
			const { query, options } = setupDefault();

			await uc.findExternalTool(currentUser.userId, query, options);

			expect(externalToolService.findExternalTools).toHaveBeenCalledWith(query, options);
		});

		it('should return a page of externalTool', async () => {
			const { currentUser } = setupAuthorization();
			const { query, options, page } = setupDefault();
			externalToolService.findExternalTools.mockResolvedValue(page);

			const resultPage: Page<ExternalTool> = await uc.findExternalTool(currentUser.userId, query, options);

			expect(resultPage).toEqual(page);
		});
	});

	describe('getExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId } = setupDefault();

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { toolId, externalTool } = setupDefault();
				externalToolService.findById.mockResolvedValue(externalTool);

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					externalTool,
					AuthorizationContextBuilder.read([Permission.TOOL_ADMIN])
				);
			});

			it('should throw if the user has insufficient permission to get an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId } = setupDefault();
				authorizationService.checkPermission.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.getExternalTool(currentUser.userId, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should fetch a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool, toolId } = setupDefault();
			externalToolService.findById.mockResolvedValue(externalTool);

			const result: ExternalTool = await uc.getExternalTool(currentUser.userId, toolId);

			expect(result).toEqual(externalTool);
		});
	});

	describe('updateExternalTool', () => {
		const setup = () => {
			const { externalTool, toolId, mockLogoBase64 } = setupDefault();

			const externalToolToUpdateProps: ExternalToolUpdate = {
				...externalTool.getProps(),
				name: 'oldName',
				url: undefined,
			};
			const updatedExternalTool: ExternalTool = externalToolFactory.build({
				...externalTool.getProps(),
				name: 'newName',
				url: undefined,
			});

			const lti11ToolConfig: Lti11ToolConfig = lti11ToolConfigFactory.build();

			externalToolService.updateExternalTool.mockResolvedValue(updatedExternalTool);
			externalToolService.findById.mockResolvedValue(new ExternalTool(externalToolToUpdateProps));

			return {
				externalTool,
				updatedExternalTool,
				externalToolToUpdateProps,
				toolId,
				mockLogoBase64,
				lti11ToolConfig,
			};
		};

		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolToUpdateProps } = setup();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolToUpdateProps);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { toolId, externalToolToUpdateProps } = setup();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolToUpdateProps);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					new ExternalTool(externalToolToUpdateProps),
					AuthorizationContextBuilder.write([Permission.TOOL_ADMIN])
				);
			});

			it('should throw if the user has insufficient permission to get an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolToUpdateProps } = setup();
				authorizationService.checkPermission.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.updateExternalTool(
					currentUser.userId,
					toolId,
					externalToolToUpdateProps
				);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should validate the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolToUpdateProps, mockLogoBase64 } = setup();

			await uc.updateExternalTool(currentUser.userId, toolId, externalToolToUpdateProps);

			expect(toolValidationService.validateUpdate).toHaveBeenCalledWith(
				toolId,
				new ExternalTool({ ...externalToolToUpdateProps, logo: mockLogoBase64, id: expect.any(String) })
			);
		});

		it('should throw if validation of the tool fails', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolToUpdateProps } = setup();
			toolValidationService.validateUpdate.mockImplementation(() => {
				throw new UnprocessableEntityException();
			});

			const result: Promise<ExternalTool> = uc.updateExternalTool(
				currentUser.userId,
				toolId,
				externalToolToUpdateProps
			);

			await expect(result).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call the service to update the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolToUpdateProps } = setup();

			await uc.updateExternalTool(currentUser.userId, toolId, externalToolToUpdateProps);

			expect(externalToolService.updateExternalTool).toHaveBeenCalled();
		});

		it('should return the updated tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolToUpdateProps, updatedExternalTool } = setup();

			const result: ExternalTool = await uc.updateExternalTool(currentUser.userId, toolId, externalToolToUpdateProps);

			expect(result).toEqual(updatedExternalTool);
		});

		describe('when fetching logo', () => {
			const setupLogo = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				externalToolService.findById.mockResolvedValue(externalTool);

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					currentUser,
					externalTool,
				};
			};

			it('should call ExternalToolLogoService', async () => {
				const { currentUser, externalTool } = setupLogo();

				await uc.updateExternalTool(currentUser.userId, externalTool.id, externalTool.getProps());

				expect(logoService.fetchLogo).toHaveBeenCalledWith(
					expect.objectContaining<ExternalToolProps>({ ...externalTool.getProps(), id: expect.any(String) })
				);
			});
		});

		describe('when no thumbnail url is given and previous is existing', () => {
			const setupThumbnail = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				const externalTool: ExternalToolUpdate = {
					...externalToolFactory.buildWithId().getProps(),
					thumbnailUrl: '',
				};

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				const existingExternalTool = externalToolFactory.withFileRecordRef().build();
				externalToolService.findById.mockResolvedValue(existingExternalTool);

				return {
					currentUser,
					externalTool,
					existingExternalTool,
				};
			};

			it('should delete existing thumbnail', async () => {
				const { currentUser, externalTool } = setupThumbnail();

				await uc.updateExternalTool(currentUser.userId, externalTool.id, externalTool);

				expect(externalToolService.updateExternalTool).toHaveBeenCalledWith(
					expect.objectContaining({ thumbnail: undefined })
				);
			});
		});

		describe('when thumbnail url is given', () => {
			const setupThumbnail = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				const externalTool: ExternalToolUpdate = {
					...externalToolFactory.buildWithId().getProps(),
					thumbnailUrl: 'https://thumbnail.url',
				};

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				const existingExternalTool = externalToolFactory.withFileRecordRef().build();
				externalToolService.findById.mockResolvedValue(existingExternalTool);

				const thumbnailFileRecordRef = fileRecordRefFactory.build();
				externalToolImageService.uploadImageFileFromUrl.mockResolvedValueOnce(thumbnailFileRecordRef);

				return {
					currentUser,
					externalTool,
					thumbnailFileRecordRef,
					existingExternalTool,
				};
			};

			it('should call ExternalToolImageService', async () => {
				const { currentUser, externalTool } = setupThumbnail();

				await uc.updateExternalTool(currentUser.userId, externalTool.id, externalTool);

				expect(externalToolImageService.uploadImageFileFromUrl).toHaveBeenCalledWith(
					externalTool.thumbnailUrl,
					ExternalTool.thumbnailNameAffix,
					externalTool.id
				);
			});

			it('should delete old thumbnail', async () => {
				const { currentUser, externalTool, existingExternalTool } = setupThumbnail();

				await uc.updateExternalTool(currentUser.userId, externalTool.id, externalTool);

				expect(externalToolImageService.deleteImageFile).toHaveBeenCalledWith(
					existingExternalTool.thumbnail?.fileRecordId
				);
			});

			it('should update external tool with thumbnail file record', async () => {
				const { currentUser, externalTool, thumbnailFileRecordRef } = setupThumbnail();

				await uc.updateExternalTool(currentUser.userId, externalTool.id, externalTool);

				expect(externalToolService.updateExternalTool).toHaveBeenCalledWith(
					expect.objectContaining<Partial<ExternalTool>>({ thumbnail: thumbnailFileRecordRef })
				);
			});
		});

		describe('when lti11 config is given and secret is not encrypted', () => {
			const setupLTI = () => {
				const { externalTool, toolId, mockLogoBase64 } = setupDefault();

				const lti11ToolConfig: Lti11ToolConfig = lti11ToolConfigFactory.build();
				const externalToolToUpdate: ExternalToolUpdate = {
					...externalTool.getProps(),
					name: 'newName',
					config: lti11ToolConfig,
					url: undefined,
					logo: mockLogoBase64,
				};

				const currentTestTool = new ExternalTool({ ...externalToolToUpdate });
				const expectedLtiConfig = lti11ToolConfigFactory.buildWithId({ secret: 'encrypted' });
				currentTestTool.config = expectedLtiConfig;

				const updatedExternalTool: ExternalTool = externalToolFactory.build({
					...externalTool.getProps(),
					name: 'newName',
					config: expectedLtiConfig,
					url: undefined,
					logo: mockLogoBase64,
				});

				externalToolService.findById.mockResolvedValue(currentTestTool);
				encryptionService.encrypt.mockReturnValue(expectedLtiConfig.secret);
				externalToolService.updateExternalTool.mockResolvedValue(updatedExternalTool);

				return {
					externalTool,
					updatedExternalToolDO: updatedExternalTool,
					externalToolDOtoUpdate: externalToolToUpdate,
					toolId,
					mockLogoBase64,
					lti11ToolConfig,
				};
			};

			it('should call encryption service', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate, lti11ToolConfig } = setupLTI();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(encryptionService.encrypt).toHaveBeenNthCalledWith(1, lti11ToolConfig.secret);
			});

			it('should call the service to update the tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate, updatedExternalToolDO } = setupLTI();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(externalToolService.updateExternalTool).toHaveBeenCalledWith(updatedExternalToolDO);
			});
		});

		describe('when lti11 config is given and secret is already encrypted', () => {
			const setupLTI = () => {
				const { externalTool, toolId, mockLogoBase64 } = setupDefault();

				const lti11ToolConfig: Lti11ToolConfigUpdate = {
					type: ToolConfigType.LTI11,
					baseUrl: 'https://www.basic-baseurl.com/',
					key: 'key',
					privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					launch_presentation_locale: 'de-DE',
				};

				const externalToolToUpdate: ExternalToolUpdate = {
					...externalTool.getProps(),
					config: lti11ToolConfig,
					name: 'newName',
					url: undefined,
				};

				const updatedExternalTool: ExternalTool = externalToolFactory.build({
					...externalTool.getProps(),
					config: lti11ToolConfigFactory.build({ ...externalTool.config, secret: 'encrypted' }),
					name: 'newName',
					url: undefined,
					logo: mockLogoBase64,
				});

				externalToolService.findById.mockResolvedValue(
					new ExternalTool({
						...externalToolToUpdate,
						config: lti11ToolConfigFactory.build({ ...externalToolToUpdate.config, secret: 'encrypted' }),
					})
				);
				externalToolService.updateExternalTool.mockResolvedValue(updatedExternalTool);

				return {
					externalTool,
					updatedExternalToolDO: updatedExternalTool,
					externalToolDOtoUpdate: externalToolToUpdate,
					toolId,
					mockLogoBase64,
					lti11ToolConfig,
				};
			};

			it('should not call encryption service', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate } = setupLTI();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(encryptionService.encrypt).not.toHaveBeenCalledWith();
			});

			it('should call the service to update the tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate, updatedExternalToolDO } = setupLTI();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(externalToolService.updateExternalTool).toHaveBeenCalledWith(updatedExternalToolDO);
			});
		});
	});

	describe('deleteExternalTool', () => {
		const setup = () => {
			const toolId = 'toolId';
			const currentUser = currentUserFactory.build();
			const user: User = userFactory.buildWithId();
			const externalTool = externalToolFactory.build();

			authorizationService.getUserWithPermissions.mockResolvedValue(user);
			externalToolService.findById.mockResolvedValueOnce(externalTool);

			return {
				toolId,
				currentUser,
				user,
				externalTool,
			};
		};

		it('should check that the user has TOOL_ADMIN permission', async () => {
			const { toolId, currentUser, user, externalTool } = setup();

			await uc.deleteExternalTool(currentUser.userId, toolId);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			expect(authorizationService.checkPermission).toHaveBeenCalledWith(
				user,
				externalTool,
				AuthorizationContextBuilder.write([Permission.TOOL_ADMIN])
			);
		});

		it('should call ExternalToolService', async () => {
			const { toolId, currentUser, externalTool } = setup();

			await uc.deleteExternalTool(currentUser.userId, toolId);

			expect(externalToolService.deleteExternalTool).toHaveBeenCalledWith(externalTool);
		});

		it('should call ExternalToolImageService', async () => {
			const { toolId, currentUser } = setup();

			await uc.deleteExternalTool(currentUser.userId, toolId);

			expect(externalToolImageService.deleteAllFiles).toHaveBeenCalledWith(toolId);
		});
	});

	describe('getDatasheet', () => {
		describe('when user has insufficient permission to create a datasheet for an external tool ', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				const user: User = userFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockRejectedValue(new UnauthorizedException());

				return {
					user,
					toolId,
				};
			};

			it('should throw UnauthorizedException ', async () => {
				const { toolId, user } = setup();

				const result = uc.getDatasheet(user.id, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when externalToolId is given', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const user: User = userFactory.buildWithId();
				const school: School = schoolFactory.build();

				const param: CustomParameter = customParameterFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({ parameters: [param] });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
					.withParameters(1, { name: param.name, properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY })
					.build({
						toolName: externalTool.name,
						instance: 'dBildungscloud',
						creatorName: `${user.firstName} ${user.lastName}`,
						schoolName: school.getInfo().name,
					});

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.hasAllPermissions.mockReturnValue(true);
				externalToolService.findById.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([schoolExternalTool]);
				schoolService.getSchoolById.mockResolvedValue(school);
				pdfService.generatePdf.mockResolvedValue(Buffer.from('mockData'));

				return {
					user,
					toolId,
					datasheetData,
					schoolExternalTool,
				};
			};

			it('should get user with permission', async () => {
				const { user, toolId } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should check that the user has TOOL_ADMIN ot SCHOOL_TOOL_ADMIN permission', async () => {
				const { user, toolId } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(authorizationService.checkOneOfPermissions).toHaveBeenCalledWith(user, [
					Permission.TOOL_ADMIN,
					Permission.SCHOOL_TOOL_ADMIN,
				]);
			});

			it('should get external tool', async () => {
				const { toolId, user } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(externalToolService.findById).toHaveBeenCalledWith(toolId);
			});

			it('should get school external tool', async () => {
				const { toolId, user } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
					schoolId: user.school.id,
					toolId,
				});
			});

			it('should get school', async () => {
				const { toolId, user, schoolExternalTool } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolExternalTool.schoolId);
			});

			it('should create pdf buffer', async () => {
				const { toolId, user, datasheetData } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(pdfService.generatePdf).toHaveBeenCalledWith(datasheetData);
			});

			it('should return buffer', async () => {
				const { toolId, user } = setup();

				const result = await uc.getDatasheet(user.id, toolId);

				expect(result).toEqual(expect.any(Buffer));
			});
		});

		describe('when there are no schoolExternalTools', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const user: User = userFactory.buildWithId();

				const externalTool: ExternalTool = externalToolFactory.build();
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
					toolName: externalTool.name,
					instance: 'dBildungscloud',
					creatorName: `${user.firstName} ${user.lastName}`,
				});

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				externalToolService.findById.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);
				pdfService.generatePdf.mockResolvedValueOnce(Buffer.from('mockData'));

				return {
					user,
					toolId,
					datasheetData,
				};
			};

			it('should create pdf buffer', async () => {
				const { toolId, user, datasheetData } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(pdfService.generatePdf).toHaveBeenCalledWith(datasheetData);
			});
		});
	});

	describe('createDatasheetFilename', () => {
		describe('when externalToolId is given', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).build();

				const date = new Date();
				jest.setSystemTime(date);
				const year = date.getFullYear();
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const dateString = `${year}-${month}-${day}`;

				const filename = `CTL-Datenblatt-${externalTool.name}-${dateString}.pdf`;

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					toolId,
					filename,
				};
			};

			it('should get datasheetData', async () => {
				const { toolId } = setup();

				await uc.createDatasheetFilename(toolId);

				expect(externalToolService.findById).toHaveBeenCalledWith(toolId);
			});

			it('should create a filename', async () => {
				const { toolId, filename } = setup();

				const result = await uc.createDatasheetFilename(toolId);

				expect(result).toEqual(filename);
			});
		});
	});
});
