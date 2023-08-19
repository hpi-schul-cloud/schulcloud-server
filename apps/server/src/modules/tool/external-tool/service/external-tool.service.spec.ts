import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
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
import { LegacyLogger, Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { ExternalToolSearchQuery } from '../../common/interface';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool, Lti11ToolConfig, Oauth2ToolConfig } from '../domain';
import { ExternalToolLogoFetchedLoggable } from '../loggable';
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
	let logger: DeepMocked<Logger>;
	let httpService: DeepMocked<HttpService>;

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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
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
		logger = module.get(Logger);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const createTools = () => {
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

	describe('createExternalTool', () => {
		describe('when basic config is set', () => {
			const setup = () => {
				const { externalTool } = createTools();
				externalToolRepo.save.mockResolvedValue(externalTool);

				return { externalTool };
			};

			it('should call the repo to save a tool', async () => {
				const { externalTool } = setup();

				await service.createExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalTool);
			});

			it('should save domain object', async () => {
				const { externalTool } = setup();

				const result: ExternalTool = await service.createExternalTool(externalTool);

				expect(result).toEqual(externalTool);
			});
		});

		describe('when oauth2 config is set', () => {
			const setup = () => {
				const { externalTool, oauth2ToolConfig, oauthClient } = createTools();
				externalTool.config = oauth2ToolConfig;

				mapper.mapDoToProviderOauthClient.mockReturnValue(oauthClient);
				externalToolRepo.save.mockResolvedValue(externalTool);

				return { externalTool, oauth2ToolConfig, oauthClient };
			};

			it('should create oauth2 client', async () => {
				const { externalTool, oauthClient } = setup();

				await service.createExternalTool(externalTool);

				expect(oauthProviderService.createOAuth2Client).toHaveBeenCalledWith(oauthClient);
			});

			it('should call the repo to save a tool', async () => {
				const { externalTool } = setup();

				await service.createExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalTool);
			});

			it('should save domain object', async () => {
				const { externalTool } = setup();

				const result: ExternalTool = await service.createExternalTool(externalTool);

				expect(result).toEqual(externalTool);
			});
		});

		describe('when lti11 config is set', () => {
			const setup = () => {
				const encryptedSecret = 'encryptedSecret';
				const { externalTool, lti11ToolConfig } = createTools();
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
				const { externalTool } = setup();

				await service.createExternalTool(externalTool);

				expect(encryptionService.encrypt).toHaveBeenCalledWith('secret');
			});

			it('should call the repo to save a tool', async () => {
				const { externalTool } = setup();

				await service.createExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalTool);
			});

			it('should save DO', async () => {
				const { externalTool, externalToolDOEncrypted } = setup();

				const result: ExternalTool = await service.createExternalTool(externalTool);

				expect(result).toEqual(externalToolDOEncrypted);
			});
		});
	});

	describe('findExternalTools', () => {
		const createQuery = () => {
			const { externalTool } = createTools();
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
			const setup = () => {
				const { query, options, page } = createQuery();
				externalToolRepo.find.mockResolvedValue(page);

				return { query, options, page };
			};

			it('should get domain objects', async () => {
				const { query, options, page } = setup();

				const result: Page<ExternalTool> = await service.findExternalTools(query, options);

				expect(result).toEqual(page);
			});
		});

		describe('when external tool with oauthConfig is set', () => {
			const setup = () => {
				const { query, options, page } = createQuery();
				const { externalTool, oauth2ToolConfig, oauthClient } = createTools();
				externalTool.config = oauth2ToolConfig;
				page.data = [externalTool];
				externalToolRepo.find.mockResolvedValue(page);
				oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

				return { query, options, externalTool, oauth2ToolConfig };
			};

			it('should get domain objects and add external oauth2 data', async () => {
				const { query, options, externalTool, oauth2ToolConfig } = setup();

				const result: Page<ExternalTool> = await service.findExternalTools(query, options);

				expect(result).toEqual({ data: [{ ...externalTool, config: oauth2ToolConfig }], total: 1 });
			});
		});

		describe('when oauthProvider throws an error', () => {
			const setup = () => {
				const { query, options, page } = createQuery();
				const { externalTool, oauth2ToolConfigWithoutExternalData, oauth2ToolConfig, oauthClient } = createTools();
				oauth2ToolConfig.clientSecret = undefined;
				externalTool.config = oauth2ToolConfigWithoutExternalData;
				page.data = [externalTool, externalToolFactory.withOauth2Config().build()];
				externalToolRepo.find.mockResolvedValue(page);
				oauthProviderService.getOAuth2Client.mockResolvedValueOnce(oauthClient);
				oauthProviderService.getOAuth2Client.mockRejectedValue(new Error('some error occurred during fetching data'));

				return {
					query,
					options,
					externalTool,
					oauth2ToolConfig,
				};
			};

			it('should filter out oauth2tools with unresolved oauthConfig ', async () => {
				const { query, options, externalTool, oauth2ToolConfig } = setup();

				const result: Page<ExternalTool> = await service.findExternalTools(query, options);

				expect(result).toEqual({ data: [{ ...externalTool, config: oauth2ToolConfig }], total: 1 });
			});
		});
	});

	describe('findExternalToolById', () => {
		describe('when external tool id is set', () => {
			const setup = () => {
				const { externalTool } = createTools();
				externalToolRepo.findById.mockResolvedValue(externalTool);

				return { externalTool };
			};

			it('should get domain object', async () => {
				const { externalTool } = setup();

				const result: ExternalTool = await service.findExternalToolById('toolId');

				expect(result).toEqual(externalTool);
			});
		});

		describe('when external tool with oauthConfig is set', () => {
			const setup = () => {
				const { externalTool, oauth2ToolConfigWithoutExternalData, oauth2ToolConfig, oauthClient } = createTools();
				oauth2ToolConfig.clientSecret = undefined;
				externalTool.config = oauth2ToolConfigWithoutExternalData;
				externalToolRepo.findById.mockResolvedValue(externalTool);
				oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

				return { externalTool, oauth2ToolConfig };
			};

			it('should get domain object and add external oauth2 data', async () => {
				const { externalTool, oauth2ToolConfig } = setup();

				const result: ExternalTool = await service.findExternalToolById('toolId');

				expect(result).toEqual({ ...externalTool, config: oauth2ToolConfig });
			});
		});

		describe('when oauthConfig could not be resolved', () => {
			const setup = () => {
				const { externalTool, oauth2ToolConfigWithoutExternalData, oauth2ToolConfig } = createTools();
				oauth2ToolConfig.clientSecret = undefined;
				externalTool.config = oauth2ToolConfigWithoutExternalData;
				externalToolRepo.findById.mockResolvedValue(externalTool);
				oauthProviderService.getOAuth2Client.mockRejectedValueOnce(
					new Error('some error occurred during fetching data')
				);

				return { externalTool };
			};

			it('should throw UnprocessableEntityException ', async () => {
				const { externalTool } = setup();

				const func = () => service.findExternalToolById('toolId');

				await expect(func()).rejects.toThrow(`Could not resolve oauth2Config of tool ${externalTool.name}.`);
			});
		});
	});

	describe('deleteExternalTool', () => {
		const setup = () => {
			createTools();

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
				const { schoolExternalTool } = setup();

				await service.deleteExternalTool(schoolExternalTool.toolId);

				expect(courseToolRepo.deleteBySchoolExternalToolIds).toHaveBeenCalledWith([schoolExternalTool.id]);
			});

			it('should delete all related SchoolExternalTools', async () => {
				const { schoolExternalTool } = setup();

				await service.deleteExternalTool(schoolExternalTool.toolId);

				expect(schoolToolRepo.deleteByExternalToolId).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});

			it('should delete the ExternalTool', async () => {
				const { schoolExternalTool } = setup();

				await service.deleteExternalTool(schoolExternalTool.toolId);

				expect(externalToolRepo.deleteById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});
		});
	});

	describe('findExternalToolByName', () => {
		describe('when name is set', () => {
			it('should call the externalToolRepo', async () => {
				const toolName = 'toolName';

				await service.findExternalToolByName(toolName);

				expect(externalToolRepo.findByName).toHaveBeenCalledWith(toolName);
			});
		});

		describe('when tool was found', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build();
				externalToolRepo.findByName.mockResolvedValue(externalTool);
			};

			it('should return externalTool ', async () => {
				setup();

				const result: ExternalTool | null = await service.findExternalToolByName('toolName');

				expect(result).toBeInstanceOf(ExternalTool);
			});
		});

		describe('when tool was not found', () => {
			const setup = () => {
				externalToolRepo.findByName.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result: ExternalTool | null = await service.findExternalToolByName('toolName');

				expect(result).toBeNull();
			});
		});
	});

	describe('findExternalToolByOAuth2ConfigClientId', () => {
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
			const setup = () => {
				externalToolRepo.findByOAuth2ConfigClientId.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result: ExternalTool | null = await service.findExternalToolByOAuth2ConfigClientId('clientId');

				expect(result).toBeNull();
			});
		});
	});

	describe('updateExternalTool', () => {
		describe('when external tool with oauthConfig is given', () => {
			const setup = () => {
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

			it('should call externalToolServiceMapper', async () => {
				const { changedTool, existingTool } = setup();

				await service.updateExternalTool(changedTool, existingTool);

				expect(mapper.mapDoToProviderOauthClient).toHaveBeenCalledWith(changedTool.name, changedTool.config);
			});
		});

		describe('when oauthClientId is set', () => {
			const setup = () => {
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

			it('should call oauthProviderService', async () => {
				const { changedTool, oauthClientId, existingTool } = setup();

				await service.updateExternalTool(changedTool, existingTool);

				expect(oauthProviderService.getOAuth2Client).toHaveBeenCalledWith(oauthClientId);
			});
		});

		describe('when oauthClientId is set and providerClient is given', () => {
			const setup = () => {
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

			it('should update the oauth2Client', async () => {
				const { changedTool, oauthClientId, providerOauthClient, existingTool } = setup();

				await service.updateExternalTool(changedTool, existingTool);

				expect(oauthProviderService.updateOAuth2Client).toHaveBeenCalledWith(oauthClientId, providerOauthClient);
			});
		});

		describe('when requested oauth2Client not exists', () => {
			const setup = () => {
				const existingTool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();
				const changedTool: ExternalTool = externalToolFactory
					.withOauth2Config()
					.build({ id: existingTool.id, name: 'newName' });

				const providerOauthClient: ProviderOauthClient = {
					client_id: undefined,
				};

				oauthProviderService.getOAuth2Client.mockResolvedValue(providerOauthClient);
				mapper.mapDoToProviderOauthClient.mockReturnValue(providerOauthClient);

				return {
					changedTool,
					existingTool,
				};
			};

			it('should throw an error ', async () => {
				const { changedTool, existingTool } = setup();

				const func = () => service.updateExternalTool(changedTool, existingTool);

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('when external tool is given', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				return {
					externalTool,
				};
			};

			it('should save the externalTool', async () => {
				const { externalTool } = setup();

				await service.updateExternalTool(externalTool, externalTool);

				expect(externalToolRepo.save).toHaveBeenCalled();
			});
		});

		describe('externalToolVersionService', () => {
			describe('when service', () => {
				const setup = () => {
					const tool1: ExternalTool = externalToolFactory.buildWithId();
					const tool2: ExternalTool = externalToolFactory.buildWithId();

					return {
						tool1,
						tool2,
					};
				};

				it('should call increaseVersionOfNewToolIfNecessary', async () => {
					const { tool1, tool2 } = setup();

					await service.updateExternalTool(tool1, tool2);

					expect(versionService.increaseVersionOfNewToolIfNecessary).toHaveBeenCalledWith(tool2, tool1);
				});
			});

			describe('when increaseVersionOfNewToolIfNecessary returns a tool with higher version', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.buildWithId();
					externalTool.version = 1;
					versionService.increaseVersionOfNewToolIfNecessary.mockImplementation((toolDO: ExternalTool) => {
						toolDO.version = 2;
						return toolDO;
					});

					return {
						externalTool,
					};
				};

				it('should increase the version of the externalTool', async () => {
					const { externalTool } = setup();

					await service.updateExternalTool(externalTool, externalTool);

					expect(externalToolRepo.save).toHaveBeenCalledWith({ ...externalTool, version: 2 });
				});
			});
		});
	});

	describe('fetchBase64Logo', () => {
		describe('when logoUrl is given', () => {
			const setup = () => {
				const logoUrl = 'https://example.com/logo.png';
				const logoBuffer: Buffer = Buffer.from('logo content', 'utf-8');
				const logoBase64: string = logoBuffer.toString('base64');

				httpService.get.mockReturnValue(
					of({
						data: logoBuffer,
						status: HttpStatus.OK,
						statusText: 'OK',
						headers: {},
						config: {},
					} as AxiosResponse<ArrayBuffer>)
				);

				return {
					logoUrl,
					logoBase64,
				};
			};

			it('should fetch logo', async () => {
				const { logoUrl } = setup();

				await service.fetchBase64Logo(logoUrl);

				expect(httpService.get).toHaveBeenCalledWith(logoUrl, { responseType: 'arraybuffer' });
			});

			it('should log the fetched url', async () => {
				const { logoUrl } = setup();

				await service.fetchBase64Logo(logoUrl);

				expect(logger.info).toHaveBeenCalledWith(new ExternalToolLogoFetchedLoggable(logoUrl));
			});

			it('should convert to base64', async () => {
				const { logoUrl, logoBase64 } = setup();

				const result: string | null = await service.fetchBase64Logo(logoUrl);

				expect(result).toBe(logoBase64);
			});
		});

		describe('when error occurs on fetching logo', () => {
			const setup = () => {
				const logoUrl = 'https://example.com/logo.png';

				httpService.get.mockReturnValue(
					throwError(() => new HttpException('Failed to fetch logo', HttpStatus.NOT_FOUND))
				);

				return {
					logoUrl,
				};
			};

			it('should throw error', async () => {
				const { logoUrl } = setup();

				const func = () => service.fetchBase64Logo(logoUrl);

				await expect(func()).rejects.toThrow(HttpException);
			});
		});
	});
});
