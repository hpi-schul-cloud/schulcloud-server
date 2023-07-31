import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, Page, SortOrder } from '@shared/domain';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import {
	externalToolFactory,
	lti11ToolConfigFactory,
	oauth2ToolConfigFactory,
} from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolSearchQuery } from '../../common/interface';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool, Lti11ToolConfig, Oauth2ToolConfig } from '../domain';
import { ExternalToolServiceMapper } from './external-tool-service.mapper';
import { ExternalToolVersionService } from './external-tool-version.service';
import { ExternalToolService } from './external-tool.service';

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
		const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).buildWithId();
		const oauth2ToolConfig: Oauth2ToolConfig = oauth2ToolConfigFactory.withExternalData().build();
		const oauth2ToolConfigWithoutExternalData: Oauth2ToolConfig = oauth2ToolConfigFactory.build();
		const lti11ToolConfig: Lti11ToolConfig = lti11ToolConfigFactory.build();

		const oauthClient: ProviderOauthClient = {
			client_id: oauth2ToolConfig.clientId,
			scope: oauth2ToolConfig.scope,
			token_endpoint_auth_method: oauth2ToolConfig.tokenEndpointAuthMethod,
			redirect_uris: oauth2ToolConfig.redirectUris,
			frontchannel_logout_uri: oauth2ToolConfig.frontchannelLogoutUri,
		};

		return {
			externalTool,
			oauth2ToolConfig,
			lti11ToolConfig,
			oauth2ToolConfigWithoutExternalData,
			oauthClient,
		};
	};

	describe('createExternalTool is called', () => {
		describe('when basic config is set', () => {
			it('should call the repo to save a tool', async () => {
				const { externalTool } = setup();
				externalToolRepo.save.mockResolvedValue(externalTool);

				await service.createExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalTool);
			});

			it('should save DO', async () => {
				const { externalTool } = setup();
				externalToolRepo.save.mockResolvedValue(externalTool);

				const result: ExternalTool = await service.createExternalTool(externalTool);

				expect(result).toEqual(externalTool);
			});
		});

		describe('when oauth2 config is set', () => {
			const setupOauth2 = () => {
				const { externalTool, oauth2ToolConfig, oauthClient } = setup();
				externalTool.config = oauth2ToolConfig;

				mapper.mapDoToProviderOauthClient.mockReturnValue(oauthClient);
				externalToolRepo.save.mockResolvedValue(externalTool);

				return { externalTool, oauth2ToolConfig, oauthClient };
			};
			it('should create oauth2 client', async () => {
				const { externalTool, oauthClient } = setupOauth2();

				await service.createExternalTool(externalTool);

				expect(oauthProviderService.createOAuth2Client).toHaveBeenCalledWith(oauthClient);
			});

			it('should call the repo to save a tool', async () => {
				const { externalTool } = setupOauth2();

				await service.createExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalTool);
			});

			it('should save DO', async () => {
				const { externalTool } = setupOauth2();

				const result: ExternalTool = await service.createExternalTool(externalTool);

				expect(result).toEqual(externalTool);
			});
		});

		describe('when lti11 config is set', () => {
			const setupLti11 = () => {
				const encryptedSecret = 'encryptedSecret';
				const { externalTool, lti11ToolConfig } = setup();
				externalTool.config = lti11ToolConfig;
				const lti11ToolConfigDOEncrypted: Lti11ToolConfig = { ...lti11ToolConfig, secret: encryptedSecret };
				const externalToolDOEncrypted: ExternalTool = externalToolFactory.build({
					...externalTool,
					config: lti11ToolConfigDOEncrypted,
				});

				encryptionService.encrypt.mockReturnValue(encryptedSecret);
				externalToolRepo.save.mockResolvedValue(externalToolDOEncrypted);

				return { externalTool, lti11ToolConfig, encryptedSecret, externalToolDOEncrypted };
			};

			it('should encrypt the secret', async () => {
				const { externalTool } = setupLti11();

				await service.createExternalTool(externalTool);

				expect(encryptionService.encrypt).toHaveBeenCalledWith('secret');
			});

			it('should call the repo to save a tool', async () => {
				const { externalTool } = setupLti11();

				await service.createExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalTool);
			});

			it('should save DO', async () => {
				const { externalTool, externalToolDOEncrypted } = setupLti11();

				const result: ExternalTool = await service.createExternalTool(externalTool);

				expect(result).toEqual(externalToolDOEncrypted);
			});
		});
	});

	describe('findExternalTools is called', () => {
		const setupFind = () => {
			const { externalTool } = setup();
			const page = new Page<ExternalTool>([externalTool], 1);
			const query: ExternalToolSearchQuery = {
				name: 'toolName',
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

				const result: Page<ExternalTool> = await service.findExternalTools(query, options);

				expect(result).toEqual(page);
			});
		});

		describe('when external tool with oauthConfig is set', () => {
			it('should get DOs and add external oauth2 data', async () => {
				const { query, options, page } = setupFind();
				const { externalTool, oauth2ToolConfigWithoutExternalData, oauth2ToolConfig, oauthClient } = setup();
				oauth2ToolConfig.clientSecret = undefined;
				externalTool.config = oauth2ToolConfigWithoutExternalData;
				page.data = [externalTool];
				externalToolRepo.find.mockResolvedValue(page);
				oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

				const result: Page<ExternalTool> = await service.findExternalTools(query, options);

				expect(result).toEqual({ data: [{ ...externalTool, config: oauth2ToolConfig }], total: 1 });
			});
		});

		describe('when oauthProvider throws an error', () => {
			it('should filter out oauth2tools with unresolved oauthConfig ', async () => {
				const { query, options, page } = setupFind();
				const { externalTool, oauth2ToolConfigWithoutExternalData, oauth2ToolConfig, oauthClient } = setup();
				oauth2ToolConfig.clientSecret = undefined;
				externalTool.config = oauth2ToolConfigWithoutExternalData;
				page.data = [externalTool, externalToolFactory.withOauth2Config().build()];
				externalToolRepo.find.mockResolvedValue(page);
				oauthProviderService.getOAuth2Client.mockResolvedValueOnce(oauthClient);
				oauthProviderService.getOAuth2Client.mockRejectedValue(new Error('some error occurred during fetching data'));

				const result: Page<ExternalTool> = await service.findExternalTools(query, options);

				expect(result).toEqual({ data: [{ ...externalTool, config: oauth2ToolConfig }], total: 1 });
			});
		});
	});

	describe('findExternalToolById is called', () => {
		describe('when external tool id is set', () => {
			it('should get DO', async () => {
				const { externalTool } = setup();
				externalToolRepo.findById.mockResolvedValue(externalTool);

				const result: ExternalTool = await service.findExternalToolById('toolId');

				expect(result).toEqual(externalTool);
			});
		});

		describe('when external tool with oauthConfig is set', () => {
			it('should get DO and add external oauth2 data', async () => {
				const { externalTool, oauth2ToolConfigWithoutExternalData, oauth2ToolConfig, oauthClient } = setup();
				oauth2ToolConfig.clientSecret = undefined;
				externalTool.config = oauth2ToolConfigWithoutExternalData;
				externalToolRepo.findById.mockResolvedValue(externalTool);
				oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

				const result: ExternalTool = await service.findExternalToolById('toolId');

				expect(result).toEqual({ ...externalTool, config: oauth2ToolConfig });
			});
		});

		describe('when oauthConfig could not be resolved', () => {
			it('should throw UnprocessableEntityException ', async () => {
				const { externalTool, oauth2ToolConfigWithoutExternalData, oauth2ToolConfig } = setup();
				oauth2ToolConfig.clientSecret = undefined;
				externalTool.config = oauth2ToolConfigWithoutExternalData;
				externalToolRepo.findById.mockResolvedValue(externalTool);
				oauthProviderService.getOAuth2Client.mockRejectedValueOnce(
					new Error('some error occurred during fetching data')
				);

				const func = () => service.findExternalToolById('toolId');

				await expect(func()).rejects.toThrow(`Could not resolve oauth2Config of tool ${externalTool.name}.`);
			});
		});
	});

	describe('deleteExternalTool is called', () => {
		const setupDelete = () => {
			const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
				id: 'schoolTool1',
				toolId: 'tool1',
				schoolId: 'school1',
				parameters: [],
				toolVersion: 1,
			});

			schoolToolRepo.findByExternalToolId.mockResolvedValue([schoolExternalTool]);

			return { schoolExternalTool };
		};

		describe('when tool id is set', () => {
			it('should delete all related CourseExternalTools', async () => {
				const toolId = 'tool1';
				setup();
				const { schoolExternalTool } = setupDelete();

				await service.deleteExternalTool(toolId);

				expect(courseToolRepo.deleteBySchoolExternalToolIds).toHaveBeenCalledWith([schoolExternalTool.id]);
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
			it('should return externalTool ', async () => {
				const externalTool: ExternalTool = externalToolFactory.build();
				externalToolRepo.findByName.mockResolvedValue(externalTool);

				const result: ExternalTool | null = await service.findExternalToolByName('toolName');

				expect(result).toBeInstanceOf(ExternalTool);
			});
		});
		describe('when tool was not found', () => {
			it('should return null', async () => {
				externalToolRepo.findByName.mockResolvedValue(null);

				const result: ExternalTool | null = await service.findExternalToolByName('toolName');

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

			it('should return externalTool when tool was found', async () => {
				const externalTool: ExternalTool = externalToolFactory.build();
				externalToolRepo.findByOAuth2ConfigClientId.mockResolvedValue(externalTool);

				const result: ExternalTool | null = await service.findExternalToolByOAuth2ConfigClientId('clientId');

				expect(result).toBeInstanceOf(ExternalTool);
			});
		});
		describe(' when externalTool was not found', () => {
			it('should return null', async () => {
				externalToolRepo.findByOAuth2ConfigClientId.mockResolvedValue(null);

				const result: ExternalTool | null = await service.findExternalToolByOAuth2ConfigClientId('clientId');

				expect(result).toBeNull();
			});
		});
	});

	describe('updateExternalTool is called', () => {
		const setupOauthConfig = () => {
			const existingTool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();
			const changedTool: ExternalTool = externalToolFactory
				.withOauth2Config()
				.build({ id: existingTool.id, name: 'newName' });

			const oauthClientId: string =
				existingTool.config instanceof Oauth2ToolConfig ? existingTool.config.clientId : 'undefined';
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
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				await service.updateExternalTool(externalTool, externalTool);

				expect(externalToolRepo.save).toHaveBeenCalled();
			});
		});

		describe('externalToolVersionService is called', () => {
			it('should call increaseVersionOfNewToolIfNecessary', async () => {
				const tool1: ExternalTool = externalToolFactory.buildWithId();
				const tool2: ExternalTool = externalToolFactory.buildWithId();

				await service.updateExternalTool(tool1, tool2);

				expect(versionService.increaseVersionOfNewToolIfNecessary).toHaveBeenCalledWith(tool2, tool1);
			});

			it('should increase the version of the externalTool', async () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				externalTool.version = 1;
				versionService.increaseVersionOfNewToolIfNecessary.mockImplementation((toolDO: ExternalTool) => {
					toolDO.version = 2;
					return toolDO;
				});

				await service.updateExternalTool(externalTool, externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith({ ...externalTool, version: 2 });
			});
		});
	});
});
