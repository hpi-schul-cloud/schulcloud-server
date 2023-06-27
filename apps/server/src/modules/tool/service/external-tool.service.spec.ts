import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomParameterScope, IFindOptions, Page, SchoolExternalToolDO, SortOrder } from '@shared/domain';
import {
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/tool';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import {
	customParameterDOFactory,
	externalToolDOFactory,
	lti11ToolConfigDOFactory,
	oauth2ToolConfigDOFactory,
} from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolSearchQuery } from '../interface';
import { ExternalToolVersionService } from './external-tool-version.service';
import { ExternalToolService } from './external-tool.service';
import { ExternalToolServiceMapper } from './mapper';

describe('ExternalToolService', () => {
	let module: TestingModule;
	let service: ExternalToolService;

	let externalToolRepo: DeepMocked<ExternalToolRepo>;
	let schoolToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let courseToolRepo: DeepMocked<ContextExternalToolRepo>;
	let oauthProviderService: DeepMocked<OauthProviderService>;
	let mapper: DeepMocked<ExternalToolServiceMapper>;
	let encryptionService: DeepMocked<IEncryptionService>;
	let versionService: DeepMocked<ExternalToolVersionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolService,
				{
					provide: ExternalToolRepo,
					useValue: createMock<ExternalToolRepo>(),
				},
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: ExternalToolServiceMapper,
					useValue: createMock<ExternalToolServiceMapper>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<IEncryptionService>(),
				},
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ExternalToolVersionService,
					useValue: createMock<ExternalToolVersionService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolService);
		externalToolRepo = module.get(ExternalToolRepo);
		schoolToolRepo = module.get(SchoolExternalToolRepo);
		courseToolRepo = module.get(ContextExternalToolRepo);
		oauthProviderService = module.get(OauthProviderService);
		mapper = module.get(ExternalToolServiceMapper);
		encryptionService = module.get(DefaultEncryptionService);
		versionService = module.get(ExternalToolVersionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();
		const oauth2ToolConfigDO: Oauth2ToolConfigDO = oauth2ToolConfigDOFactory.withExternalData().build();
		const oauth2ToolConfigDOWithoutExternalData: Oauth2ToolConfigDO = oauth2ToolConfigDOFactory.build();
		const lti11ToolConfigDO: Lti11ToolConfigDO = lti11ToolConfigDOFactory.build();

		const oauthClient: ProviderOauthClient = {
			client_id: oauth2ToolConfigDO.clientId,
			scope: oauth2ToolConfigDO.scope,
			token_endpoint_auth_method: oauth2ToolConfigDO.tokenEndpointAuthMethod,
			redirect_uris: oauth2ToolConfigDO.redirectUris,
			frontchannel_logout_uri: oauth2ToolConfigDO.frontchannelLogoutUri,
		};

		return {
			externalToolDO,
			oauth2ToolConfigDO,
			lti11ToolConfigDO,
			oauth2ToolConfigDOWithoutExternalData,
			oauthClient,
		};
	};

	describe('createExternalTool is called', () => {
		describe('when basic config is set', () => {
			it('should call the repo to save a tool', async () => {
				const { externalToolDO } = setup();
				externalToolRepo.save.mockResolvedValue(externalToolDO);

				await service.createExternalTool(externalToolDO);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalToolDO);
			});

			it('should save DO', async () => {
				const { externalToolDO } = setup();
				externalToolRepo.save.mockResolvedValue(externalToolDO);

				const result: ExternalToolDO = await service.createExternalTool(externalToolDO);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when oauth2 config is set', () => {
			const setupOauth2 = () => {
				const { externalToolDO, oauth2ToolConfigDO, oauthClient } = setup();
				externalToolDO.config = oauth2ToolConfigDO;

				mapper.mapDoToProviderOauthClient.mockReturnValue(oauthClient);
				externalToolRepo.save.mockResolvedValue(externalToolDO);

				return { externalToolDO, oauth2ToolConfigDO, oauthClient };
			};
			it('should create oauth2 client', async () => {
				const { externalToolDO, oauthClient } = setupOauth2();

				await service.createExternalTool(externalToolDO);

				expect(oauthProviderService.createOAuth2Client).toHaveBeenCalledWith(oauthClient);
			});

			it('should call the repo to save a tool', async () => {
				const { externalToolDO } = setupOauth2();

				await service.createExternalTool(externalToolDO);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalToolDO);
			});

			it('should save DO', async () => {
				const { externalToolDO } = setupOauth2();

				const result: ExternalToolDO = await service.createExternalTool(externalToolDO);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when lti11 config is set', () => {
			const setupLti11 = () => {
				const encryptedSecret = 'encryptedSecret';
				const { externalToolDO, lti11ToolConfigDO } = setup();
				externalToolDO.config = lti11ToolConfigDO;
				const lti11ToolConfigDOEncrypted: Lti11ToolConfigDO = { ...lti11ToolConfigDO, secret: encryptedSecret };
				const externalToolDOEncrypted: ExternalToolDO = externalToolDOFactory.build({
					...externalToolDO,
					config: lti11ToolConfigDOEncrypted,
				});

				encryptionService.encrypt.mockReturnValue(encryptedSecret);
				externalToolRepo.save.mockResolvedValue(externalToolDOEncrypted);

				return { externalToolDO, lti11ToolConfigDO, encryptedSecret, externalToolDOEncrypted };
			};

			it('should encrypt the secret', async () => {
				const { externalToolDO } = setupLti11();

				await service.createExternalTool(externalToolDO);

				expect(encryptionService.encrypt).toHaveBeenCalledWith('secret');
			});

			it('should call the repo to save a tool', async () => {
				const { externalToolDO } = setupLti11();

				await service.createExternalTool(externalToolDO);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalToolDO);
			});

			it('should save DO', async () => {
				const { externalToolDO, externalToolDOEncrypted } = setupLti11();

				const result: ExternalToolDO = await service.createExternalTool(externalToolDO);

				expect(result).toEqual(externalToolDOEncrypted);
			});
		});
	});

	describe('findExternalTools is called', () => {
		const setupFind = () => {
			const { externalToolDO } = setup();
			const page = new Page<ExternalToolDO>([externalToolDO], 1);
			const query: ExternalToolSearchQuery = {
				name: 'toolName',
			};
			const options: IFindOptions<ExternalToolDO> = {
				order: {
					id: SortOrder.asc,
					name: SortOrder.asc,
				},
				pagination: {
					limit: 2,
					skip: 1,
				},
			};

			return {
				query,
				options,
				page,
			};
		};

		describe('when pagination, order and scope are set', () => {
			it('should get DOs', async () => {
				const { query, options, page } = setupFind();
				externalToolRepo.find.mockResolvedValue(page);

				const result: Page<ExternalToolDO> = await service.findExternalTools(query, options);

				expect(result).toEqual(page);
			});
		});

		describe('when external tool with oauthConfig is set', () => {
			it('should get DOs and add external oauth2 data', async () => {
				const { query, options, page } = setupFind();
				const { externalToolDO, oauth2ToolConfigDOWithoutExternalData, oauth2ToolConfigDO, oauthClient } = setup();
				oauth2ToolConfigDO.clientSecret = undefined;
				externalToolDO.config = oauth2ToolConfigDOWithoutExternalData;
				page.data = [externalToolDO];
				externalToolRepo.find.mockResolvedValue(page);
				oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

				const result: Page<ExternalToolDO> = await service.findExternalTools(query, options);

				expect(result).toEqual({ data: [{ ...externalToolDO, config: oauth2ToolConfigDO }], total: 1 });
			});
		});

		describe('when oauthProvider throws an error', () => {
			it('should filter out oauth2tools with unresolved oauthConfig ', async () => {
				const { query, options, page } = setupFind();
				const { externalToolDO, oauth2ToolConfigDOWithoutExternalData, oauth2ToolConfigDO, oauthClient } = setup();
				oauth2ToolConfigDO.clientSecret = undefined;
				externalToolDO.config = oauth2ToolConfigDOWithoutExternalData;
				page.data = [externalToolDO, externalToolDOFactory.withOauth2Config().build()];
				externalToolRepo.find.mockResolvedValue(page);
				oauthProviderService.getOAuth2Client.mockResolvedValueOnce(oauthClient);
				oauthProviderService.getOAuth2Client.mockRejectedValue(new Error('some error occurred during fetching data'));

				const result: Page<ExternalToolDO> = await service.findExternalTools(query, options);

				expect(result).toEqual({ data: [{ ...externalToolDO, config: oauth2ToolConfigDO }], total: 1 });
			});
		});
	});

	describe('findExternalToolById is called', () => {
		describe('when external tool id is set', () => {
			it('should get DO', async () => {
				const { externalToolDO } = setup();
				externalToolRepo.findById.mockResolvedValue(externalToolDO);

				const result: ExternalToolDO = await service.findExternalToolById('toolId');

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when external tool with oauthConfig is set', () => {
			it('should get DO and add external oauth2 data', async () => {
				const { externalToolDO, oauth2ToolConfigDOWithoutExternalData, oauth2ToolConfigDO, oauthClient } = setup();
				oauth2ToolConfigDO.clientSecret = undefined;
				externalToolDO.config = oauth2ToolConfigDOWithoutExternalData;
				externalToolRepo.findById.mockResolvedValue(externalToolDO);
				oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

				const result: ExternalToolDO = await service.findExternalToolById('toolId');

				expect(result).toEqual({ ...externalToolDO, config: oauth2ToolConfigDO });
			});
		});

		describe('when oauthConfig could not be resolved', () => {
			it('should throw UnprocessableEntityException ', async () => {
				const { externalToolDO, oauth2ToolConfigDOWithoutExternalData, oauth2ToolConfigDO } = setup();
				oauth2ToolConfigDO.clientSecret = undefined;
				externalToolDO.config = oauth2ToolConfigDOWithoutExternalData;
				externalToolRepo.findById.mockResolvedValue(externalToolDO);
				oauthProviderService.getOAuth2Client.mockRejectedValueOnce(
					new Error('some error occurred during fetching data')
				);

				const func = () => service.findExternalToolById('toolId');

				await expect(func()).rejects.toThrow(`Could not resolve oauth2Config of tool ${externalToolDO.name}.`);
			});
		});
	});

	describe('deleteExternalTool is called', () => {
		const setupDelete = () => {
			const schoolExternalToolDO: SchoolExternalToolDO = new SchoolExternalToolDO({
				id: 'schoolTool1',
				toolId: 'tool1',
				schoolId: 'school1',
				parameters: [],
				toolVersion: 1,
			});

			schoolToolRepo.findByExternalToolId.mockResolvedValue([schoolExternalToolDO]);

			return { schoolExternalToolDO };
		};

		describe('when tool id is set', () => {
			it('should delete all related CourseExternalTools', async () => {
				const toolId = 'tool1';
				setup();
				const { schoolExternalToolDO } = setupDelete();

				await service.deleteExternalTool(toolId);

				expect(courseToolRepo.deleteBySchoolExternalToolIds).toHaveBeenCalledWith([schoolExternalToolDO.id]);
			});

			it('should delete all related SchoolExternalTools', async () => {
				const toolId = 'tool1';
				setup();
				setupDelete();

				await service.deleteExternalTool(toolId);

				expect(schoolToolRepo.deleteByExternalToolId).toHaveBeenCalledWith(toolId);
			});

			it('should delete the ExternalTool', async () => {
				const toolId = 'tool1';
				setup();
				setupDelete();

				await service.deleteExternalTool(toolId);

				expect(externalToolRepo.deleteById).toHaveBeenCalledWith(toolId);
			});
		});
	});

	describe('findExternalToolByName is called', () => {
		describe('when name is set', () => {
			it('should call the externalToolRepo', async () => {
				const toolName = 'toolName';

				await service.findExternalToolByName(toolName);

				expect(externalToolRepo.findByName).toHaveBeenCalledWith(toolName);
			});
		});
		describe('when tool was found', () => {
			it('should return externalToolDO ', async () => {
				const externalTool: ExternalToolDO = externalToolDOFactory.build();
				externalToolRepo.findByName.mockResolvedValue(externalTool);

				const result: ExternalToolDO | null = await service.findExternalToolByName('toolName');

				expect(result).toBeInstanceOf(ExternalToolDO);
			});
		});
		describe('when tool was not found', () => {
			it('should return null', async () => {
				externalToolRepo.findByName.mockResolvedValue(null);

				const result: ExternalToolDO | null = await service.findExternalToolByName('toolName');

				expect(result).toBeNull();
			});
		});
	});

	describe('findExternalToolByOAuth2ConfigClientId is called', () => {
		describe('when oauthClient id is set', () => {
			it('should call the externalToolRepo', async () => {
				const clientId = 'clientId';

				await service.findExternalToolByOAuth2ConfigClientId(clientId);

				expect(externalToolRepo.findByOAuth2ConfigClientId).toHaveBeenCalledWith(clientId);
			});

			it('should return externalToolDO when tool was found', async () => {
				const externalTool: ExternalToolDO = externalToolDOFactory.build();
				externalToolRepo.findByOAuth2ConfigClientId.mockResolvedValue(externalTool);

				const result: ExternalToolDO | null = await service.findExternalToolByOAuth2ConfigClientId('clientId');

				expect(result).toBeInstanceOf(ExternalToolDO);
			});
		});
		describe(' when externalTool was not found', () => {
			it('should return null', async () => {
				externalToolRepo.findByOAuth2ConfigClientId.mockResolvedValue(null);

				const result: ExternalToolDO | null = await service.findExternalToolByOAuth2ConfigClientId('clientId');

				expect(result).toBeNull();
			});
		});
	});

	describe('updateExternalTool is called', () => {
		const setupOauthConfig = () => {
			const existingTool: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();
			const changedTool: ExternalToolDO = externalToolDOFactory
				.withOauth2Config()
				.build({ id: existingTool.id, name: 'newName' });

			const oauthClientId: string =
				existingTool.config instanceof Oauth2ToolConfigDO ? existingTool.config.clientId : 'undefined';
			const providerOauthClient: ProviderOauthClient = {
				client_id: oauthClientId,
			};

			oauthProviderService.getOAuth2Client.mockResolvedValue(providerOauthClient);
			mapper.mapDoToProviderOauthClient.mockReturnValue(providerOauthClient);

			return {
				existingTool,
				changedTool,
				providerOauthClient,
				oauthClientId,
			};
		};

		describe('when external tool with oauthConfig is given', () => {
			it('should call externalToolServiceMapper', async () => {
				const { changedTool, existingTool } = setupOauthConfig();

				await service.updateExternalTool(changedTool, existingTool);

				expect(mapper.mapDoToProviderOauthClient).toHaveBeenCalledWith(changedTool.name, changedTool.config);
			});
		});

		describe('when oauthClientId is set', () => {
			it('should call oauthProviderService', async () => {
				const { changedTool, oauthClientId, existingTool } = setupOauthConfig();

				await service.updateExternalTool(changedTool, existingTool);

				expect(oauthProviderService.getOAuth2Client).toHaveBeenCalledWith(oauthClientId);
			});
		});

		describe('when oauthClientId is set and providerClient is given', () => {
			it('should update the oauth2Client', async () => {
				const { changedTool, oauthClientId, providerOauthClient, existingTool } = setupOauthConfig();

				await service.updateExternalTool(changedTool, existingTool);

				expect(oauthProviderService.updateOAuth2Client).toHaveBeenCalledWith(oauthClientId, providerOauthClient);
			});
		});

		describe('when requested oauth2Client not exists', () => {
			it('should throw an error ', async () => {
				const { changedTool, providerOauthClient, existingTool } = setupOauthConfig();
				providerOauthClient.client_id = undefined;
				oauthProviderService.getOAuth2Client.mockResolvedValue(providerOauthClient);

				const func = () => service.updateExternalTool(changedTool, existingTool);

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('when external tool is given', () => {
			it('should save the externalTool', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				await service.updateExternalTool(externalToolDO, externalToolDO);

				expect(externalToolRepo.save).toHaveBeenCalled();
			});
		});

		describe('externalToolVersionService is called', () => {
			it('should call increaseVersionOfNewToolIfNecessary', async () => {
				const tool1: ExternalToolDO = externalToolDOFactory.buildWithId();
				const tool2: ExternalToolDO = externalToolDOFactory.buildWithId();

				await service.updateExternalTool(tool1, tool2);

				expect(versionService.increaseVersionOfNewToolIfNecessary).toHaveBeenCalledWith(tool2, tool1);
			});

			it('should increase the version of the externalTool', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolDO.version = 1;
				versionService.increaseVersionOfNewToolIfNecessary.mockImplementation((toolDO: ExternalToolDO) => {
					toolDO.version = 2;
					return toolDO;
				});

				await service.updateExternalTool(externalToolDO, externalToolDO);

				expect(externalToolRepo.save).toHaveBeenCalledWith({ ...externalToolDO, version: 2 });
			});
		});
	});

	describe('isLti11Config is called', () => {
		describe('when external tool with config.type Lti11 is given', () => {
			it('should return true', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withLti11Config().buildWithId();

				const func = () => service.isLti11Config(externalToolDO.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Lti11 is not given', () => {
			it('should return false', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const func = () => service.isLti11Config(externalToolDO.config);

				expect(func()).toBeFalsy();
			});
		});
	});

	describe('isOauth2Config is called', () => {
		describe('when external tool with config.type Oauth2 is given', () => {
			it('should return true', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();

				const func = () => service.isOauth2Config(externalToolDO.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Oauth2 is not given', () => {
			it('should return false', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const func = () => service.isOauth2Config(externalToolDO.config);

				expect(func()).toBeFalsy();
			});
		});
	});

	describe('getExternalToolForScope is called', () => {
		describe('when scope school is given', () => {
			it('should return an external tool with only school scoped custom parameters', async () => {
				const schoolParameters: CustomParameterDO[] = customParameterDOFactory.buildList(1, {
					scope: CustomParameterScope.SCHOOL,
				});
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(
					{
						parameters: [
							...schoolParameters,
							...customParameterDOFactory.buildList(1, { scope: CustomParameterScope.CONTEXT }),
							...customParameterDOFactory.buildList(2, { scope: CustomParameterScope.GLOBAL }),
						],
					},
					'toolId'
				);
				const expected: ExternalToolDO = externalToolDOFactory.build({
					...externalToolDO,
					parameters: schoolParameters,
				});

				externalToolRepo.findById.mockResolvedValue(externalToolDO);

				const result: ExternalToolDO = await service.getExternalToolForScope('toolId', CustomParameterScope.SCHOOL);

				expect(result).toEqual(expected);
			});
		});
	});
});
