import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderService, ProviderOauthClient } from '@modules/oauth-provider/domain';
import { providerOauthClientFactory } from '@modules/oauth-provider/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { ExternalToolSearchQuery } from '../../common/interface';
import { CommonToolDeleteService } from '../../common/service';
import { ExternalTool, Lti11ToolConfig, Oauth2ToolConfig } from '../domain';
import { ExternalToolMediumStatus } from '../enum';
import { ExternalToolRepo } from '../repo';
import { externalToolFactory, lti11ToolConfigFactory, oauth2ToolConfigFactory } from '../testing';
import { ExternalToolServiceMapper } from './external-tool-service.mapper';
import { ExternalToolService } from './external-tool.service';

describe(ExternalToolService.name, () => {
	let module: TestingModule;
	let service: ExternalToolService;

	let externalToolRepo: DeepMocked<ExternalToolRepo>;
	let oauthProviderService: DeepMocked<OauthProviderService>;
	let commonToolDeleteService: DeepMocked<CommonToolDeleteService>;
	let mapper: DeepMocked<ExternalToolServiceMapper>;

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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: CommonToolDeleteService,
					useValue: createMock<CommonToolDeleteService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolService);
		externalToolRepo = module.get(ExternalToolRepo);
		oauthProviderService = module.get(OauthProviderService);
		mapper = module.get(ExternalToolServiceMapper);
		commonToolDeleteService = module.get(CommonToolDeleteService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const createTools = () => {
		const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).withMedium().buildWithId();
		const oauth2ToolConfig: Oauth2ToolConfig = oauth2ToolConfigFactory.withExternalData().build();
		const oauth2ToolConfigWithoutExternalData: Oauth2ToolConfig = oauth2ToolConfigFactory.build();
		const lti11ToolConfig: Lti11ToolConfig = lti11ToolConfigFactory.build();

		const oauthClient: ProviderOauthClient = providerOauthClientFactory.build({
			client_id: oauth2ToolConfig.clientId,
			scope: oauth2ToolConfig.scope,
			token_endpoint_auth_method: oauth2ToolConfig.tokenEndpointAuthMethod,
			redirect_uris: oauth2ToolConfig.redirectUris,
			frontchannel_logout_uri: oauth2ToolConfig.frontchannelLogoutUri,
		});

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
				const { externalTool, lti11ToolConfig } = createTools();
				externalTool.config = lti11ToolConfig;

				externalToolRepo.save.mockResolvedValue(externalTool);

				return { externalTool, lti11ToolConfig };
			};

			it('should call the repo to save a tool', async () => {
				const { externalTool } = setup();

				await service.createExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalledWith(externalTool);
			});

			it('should save DO', async () => {
				const { externalTool } = setup();

				const result: ExternalTool = await service.createExternalTool(externalTool);

				expect(result).toEqual(externalTool);
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

				expect(result).toEqual({
					data: [expect.objectContaining<Partial<ExternalTool>>({ ...externalTool, config: oauth2ToolConfig })],
					total: 1,
				});
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

				expect(result).toEqual({
					data: [expect.objectContaining<Partial<ExternalTool>>({ ...externalTool, config: oauth2ToolConfig })],
					total: 1,
				});
			});
		});
	});

	describe('findById', () => {
		describe('when external tool id is set', () => {
			const setup = () => {
				const { externalTool } = createTools();
				externalToolRepo.findById.mockResolvedValue(externalTool);

				return { externalTool };
			};

			it('should get domain object', async () => {
				const { externalTool } = setup();

				const result: ExternalTool = await service.findById('toolId');

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

				const result: ExternalTool = await service.findById('toolId');

				expect(result).toEqual(
					expect.objectContaining<Partial<ExternalTool>>({
						...externalTool,
						config: oauth2ToolConfig,
						id: expect.any(String),
					})
				);
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

				const func = () => service.findById('toolId');

				await expect(func()).rejects.toThrow(`Could not resolve oauth2Config of tool ${externalTool.name}.`);
			});
		});
	});

	describe('deleteExternalTool', () => {
		const setup = () => {
			const clientId = 'clientId';
			const externalTool = externalToolFactory
				.withOauth2Config({
					clientId,
				})
				.build();

			return {
				externalTool,
				clientId,
			};
		};

		describe('when deleting an external tool', () => {
			it('should delete the external tool', async () => {
				const { externalTool } = setup();

				await service.deleteExternalTool(externalTool);

				expect(commonToolDeleteService.deleteExternalTool).toHaveBeenCalledWith(externalTool);
			});
		});

		describe('when deleting an oauth2 external tool', () => {
			it('should delete the oauth2 client', async () => {
				const { externalTool, clientId } = setup();

				await service.deleteExternalTool(externalTool);

				expect(oauthProviderService.deleteOAuth2Client).toHaveBeenCalledWith(clientId);
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

	describe('findExternalToolByMedium', () => {
		describe('when medium is set', () => {
			it('should call the externalToolRepo', async () => {
				const mediumId = 'mediumId';
				const mediaSourceId = 'mediaSourceId';

				await service.findExternalToolByMedium(mediumId, mediaSourceId);

				expect(externalToolRepo.findByMedium).toHaveBeenCalledWith(mediumId, mediaSourceId);
			});
		});

		describe('when tool was found', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					medium: {
						mediumId: 'mediumId',
						mediaSourceId: 'mediaSourceId',
					},
				});
				externalToolRepo.findByMedium.mockResolvedValue(externalTool);
			};

			it('should return externalTool', async () => {
				setup();

				const result: ExternalTool | null = await service.findExternalToolByMedium('mediumId', 'mediaSourceId');

				expect(result).toBeInstanceOf(ExternalTool);
			});
		});

		describe('when tool was not found', () => {
			const setup = () => {
				externalToolRepo.findByMedium.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result: ExternalTool | null = await service.findExternalToolByMedium('mediumId');

				expect(result).toBeNull();
			});
		});
	});

	describe('findTemplate', () => {
		describe('when the tool was found', () => {
			const setup = () => {
				const mediaSourceId = 'mediaSourceId';

				const externalTool = externalToolFactory.build({
					medium: {
						mediaSourceId,
						status: ExternalToolMediumStatus.TEMPLATE,
					},
				});

				externalToolRepo.findTemplate.mockResolvedValue(externalTool);

				return {
					mediaSourceId,
					externalTool,
				};
			};

			it('should search the tool', async () => {
				const { mediaSourceId } = setup();

				await service.findTemplate(mediaSourceId);

				expect(externalToolRepo.findTemplate).toHaveBeenCalledWith(mediaSourceId);
			});

			it('should return the tool', async () => {
				const { mediaSourceId, externalTool } = setup();

				const result = await service.findTemplate(mediaSourceId);

				expect(result).toEqual(externalTool);
			});
		});

		describe('when the tool was not found', () => {
			const setup = () => {
				externalToolRepo.findTemplate.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result = await service.findTemplate('mediaSourceId');

				expect(result).toBeNull();
			});
		});
	});

	describe('updateExternalTool', () => {
		describe('when external tool with lti11 config is given', () => {
			const setup = () => {
				const changedTool: ExternalTool = externalToolFactory
					.withLti11Config({ secret: 'newEncryptedSecret' })
					.build({ name: 'newName' });

				return {
					changedTool,
				};
			};

			it('should call externalToolServiceMapper', async () => {
				const { changedTool } = setup();

				await service.updateExternalTool(changedTool);

				expect(externalToolRepo.save).toHaveBeenLastCalledWith(changedTool);
			});
		});

		describe('when external tool with oauthConfig is given', () => {
			const setup = () => {
				const existingTool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();
				const changedTool: ExternalTool = externalToolFactory
					.withOauth2Config()
					.build({ id: existingTool.id, name: 'newName' });

				const oauthClientId: string =
					existingTool.config instanceof Oauth2ToolConfig ? existingTool.config.clientId : 'undefined';
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build({
					client_id: oauthClientId,
				});

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
				const { changedTool } = setup();

				await service.updateExternalTool(changedTool);

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
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build({
					client_id: oauthClientId,
				});

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
				const { changedTool, oauthClientId } = setup();

				await service.updateExternalTool(changedTool);

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
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build({
					client_id: oauthClientId,
				});

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
				const { changedTool, oauthClientId, providerOauthClient } = setup();

				await service.updateExternalTool(changedTool);

				expect(oauthProviderService.updateOAuth2Client).toHaveBeenCalledWith(oauthClientId, providerOauthClient);
			});
		});

		describe('when requested oauth2Client not exists', () => {
			const setup = () => {
				const existingTool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();
				const changedTool: ExternalTool = externalToolFactory
					.withOauth2Config()
					.build({ id: existingTool.id, name: 'newName' });

				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build({
					client_id: undefined,
				});

				oauthProviderService.getOAuth2Client.mockResolvedValue(providerOauthClient);
				mapper.mapDoToProviderOauthClient.mockReturnValue(providerOauthClient);

				return {
					changedTool,
					existingTool,
				};
			};

			it('should throw an error ', async () => {
				const { changedTool } = setup();

				const func = () => service.updateExternalTool(changedTool);

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

				await service.updateExternalTool(externalTool);

				expect(externalToolRepo.save).toHaveBeenCalled();
			});
		});
	});

	describe('findExternalToolsByMediaSource', () => {
		const setup = () => {
			const { externalTool } = createTools();
			externalToolRepo.findAllByMediaSource.mockResolvedValue([externalTool]);

			return { externalTool };
		};

		it('should get domain object', async () => {
			const { externalTool } = setup();

			const result: ExternalTool[] = await service.findExternalToolsByMediaSource('mediaSourceId');

			expect(result).toEqual([externalTool]);
		});
	});

	describe('updateExternalTools', () => {
		const setup = () => {
			const { externalTool } = createTools();
			externalToolRepo.saveAll.mockResolvedValue([externalTool]);

			return { externalTool };
		};

		it('should save all the external tools', async () => {
			const { externalTool } = setup();

			await service.updateExternalTools([externalTool]);

			expect(externalToolRepo.saveAll).toBeCalled();
		});

		it('should return the updated external tools', async () => {
			const { externalTool } = setup();

			const result: ExternalTool[] = await service.updateExternalTools([externalTool]);

			expect(result).toEqual([externalTool]);
		});
	});

	describe('findExternalToolsByName', () => {
		const setup = () => {
			const name = 'test-tool';
			const externalTool = externalToolFactory.build({ name });

			externalToolRepo.findAllByName.mockResolvedValue([externalTool]);

			return { name, externalTool };
		};

		it('should find the external tools by name', async () => {
			const { name } = setup();

			await service.findExternalToolsByName(name);

			expect(externalToolRepo.findAllByName).toBeCalledWith(name);
		});

		it('should return the found external tools', async () => {
			const { name, externalTool } = setup();

			const result = await service.findExternalToolsByName(name);

			expect(result).toEqual([externalTool]);
		});
	});
});
