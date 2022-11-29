import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@src/modules';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import {
	BasicToolConfigDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { ICurrentUser, IFindOptions, Permission, SortOrder, ToolConfigType, User } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { Page } from '@shared/domain/interface/page';
import { ExternalToolUc } from './external-tool.uc';
import { ExternalToolService } from '../service/external-tool.service';
import { ExternalToolRequestMapper } from '../mapper/external-tool-request.mapper';
import { TokenEndpointAuthMethod } from '../interface/token-endpoint-auth-method.enum';
import { LtiMessageType } from '../interface/lti-message-type.enum';
import { LtiPrivacyPermission } from '../interface/lti-privacy-permission.enum';

describe('ExternalToolUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: ExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let externalToolMapper: DeepMocked<ExternalToolRequestMapper>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let oauthProviderService: DeepMocked<OauthProviderService>;
	let oAuthEncryptionService: DeepMocked<IEncryptionService>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				ExternalToolUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: ExternalToolRequestMapper,
					useValue: createMock<ExternalToolRequestMapper>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<IEncryptionService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolUc);
		externalToolService = module.get(ExternalToolService);
		externalToolMapper = module.get(ExternalToolRequestMapper);
		authorizationService = module.get(AuthorizationService);
		oauthProviderService = module.get(OauthProviderService);
		oAuthEncryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	function setup() {
		const basicConfig: BasicToolConfigDO = new BasicToolConfigDO({
			type: ToolConfigType.BASIC,
			baseUrl: 'baseUrl',
		});

		const oauth2ConfigWithoutExternalData: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
			type: ToolConfigType.OAUTH2,
			baseUrl: 'baseUrl',
			clientId: 'clientId',
			skipConsent: false,
		});

		const externalToolDO: ExternalToolDO = new ExternalToolDO({
			id: 'id',
			name: 'name',
			url: 'url',
			logoUrl: 'logoUrl',
			config: basicConfig,
			parameters: [],
			isHidden: false,
			openNewTab: false,
			version: 1,
		});

		const query: Partial<ExternalToolDO> = {
			id: externalToolDO.id,
			name: externalToolDO.name,
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
		const page: Page<ExternalToolDO> = new Page<ExternalToolDO>(
			[{ ...externalToolDO, config: oauth2ConfigWithoutExternalData }],
			1
		);

		const user: User = userFactory.buildWithId();
		const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

		authorizationService.getUserWithPermissions.mockResolvedValue(user);
		externalToolService.isNameUnique.mockResolvedValue(true);
		externalToolService.isClientIdUnique.mockResolvedValue(true);
		externalToolService.hasDuplicateAttributes.mockReturnValue(false);
		externalToolService.validateByRegex.mockReturnValue(true);
		externalToolService.createExternalTool.mockResolvedValue(externalToolDO);
		externalToolService.findExternalTools.mockResolvedValue(page);

		return {
			externalToolDO,
			basicConfig,
			oauth2ConfigWithoutExternalData,
			user,
			currentUser,
			options,
			page,
			query,
		};
	}

	function oauthSetup() {
		const oauth2ConfigWithExternalData: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
			type: ToolConfigType.OAUTH2,
			baseUrl: 'baseUrl',
			clientId: 'clientId',
			clientSecret: 'clientSecret',
			skipConsent: false,
			tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
			frontchannelLogoutUri: 'frontchannelLogoutUri',
			scope: 'openid offline',
			redirectUris: ['redirectUri1', 'redirectUri2'],
		});

		const oauthClient: ProviderOauthClient = {
			client_id: 'clientId',
			client_secret: 'clientSecret',
			token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
			frontchannel_logout_uri: 'frontchannelLogoutUri',
			scope: 'openid offline',
			redirect_uris: ['redirectUri1', 'redirectUri2'],
		};

		oauthProviderService.createOAuth2Client.mockResolvedValue(oauthClient);
		oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);
		externalToolMapper.mapDoToProviderOauthClient.mockReturnValue(oauthClient);
		externalToolMapper.applyProviderOauthClientToDO.mockReturnValue(oauth2ConfigWithExternalData);

		return {
			oauth2ConfigWithExternalData,
			oauthClient,
		};
	}

	function setupOauth2() {
		const { oauth2ConfigWithExternalData, oauthClient } = oauthSetup();
		const setupData = setup();
		setupData.externalToolDO.config = oauth2ConfigWithExternalData;

		const oauth2ToolFromDb: ExternalToolDO = { ...setupData.externalToolDO };
		oauth2ToolFromDb.config = setupData.oauth2ConfigWithoutExternalData;

		externalToolService.findExternalToolById.mockResolvedValue(oauth2ToolFromDb);
		externalToolService.createExternalTool.mockResolvedValue(oauth2ToolFromDb);

		return {
			...setupData,
			oauth2ToolFromDb,
			oauthClient,
		};
	}

	describe('createExternalTool', () => {
		describe('Authorization', () => {
			it('should successfully check the user permission with the authorization service', async () => {
				const { externalToolDO, currentUser, user } = setup();

				await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to create an external tool', async () => {
				const { externalToolDO, currentUser } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalToolDO> = uc.createExternalTool(externalToolDO, currentUser.userId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('Validation', () => {
			it('should pass if tool name is unique, it has no duplicate attributes, all regex are valid and the client id is unique', async () => {
				const { oauth2ConfigWithExternalData } = oauthSetup();
				const { externalToolDO, currentUser } = setup();
				externalToolDO.config = oauth2ConfigWithExternalData;

				const result: Promise<ExternalToolDO> = uc.createExternalTool(externalToolDO, currentUser.userId);

				await expect(result).resolves.not.toThrow(UnprocessableEntityException);
			});

			it('should throw if the client id is not unique', async () => {
				const { oauth2ConfigWithExternalData } = oauthSetup();
				const { externalToolDO, currentUser } = setup();
				externalToolDO.config = oauth2ConfigWithExternalData;
				externalToolService.isClientIdUnique.mockResolvedValue(false);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(externalToolDO, currentUser.userId);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});

			it('should throw if name is not unique', async () => {
				const { externalToolDO, currentUser } = setup();
				externalToolService.isNameUnique.mockResolvedValue(false);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(externalToolDO, currentUser.userId);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});

			it('should throw if tool has duplicate custom attributes', async () => {
				const { externalToolDO, currentUser } = setup();
				externalToolService.hasDuplicateAttributes.mockReturnValue(true);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(externalToolDO, currentUser.userId);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});

			it('should throw if tool has custom attributes with invalid regex', async () => {
				const { externalToolDO, currentUser } = setup();
				externalToolService.validateByRegex.mockReturnValue(false);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(externalToolDO, currentUser.userId);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		describe('Basic Tool', () => {
			it('should save basic tool', async () => {
				const { externalToolDO, currentUser, basicConfig } = setup();
				externalToolDO.config = basicConfig;

				await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(externalToolService.createExternalTool).toHaveBeenCalled();
			});

			it('should return saved basic tool', async () => {
				const { externalToolDO, currentUser, basicConfig } = setup();
				externalToolDO.config = basicConfig;

				const result: ExternalToolDO = await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('Oauth2 Tool', () => {
			it('should create a new oauth2 client with the oauth provider service', async () => {
				const { externalToolDO, currentUser, oauthClient } = setupOauth2();

				await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(oauthProviderService.createOAuth2Client).toHaveBeenCalledWith(oauthClient);
			});

			it('should save auth2 tool', async () => {
				const { externalToolDO, currentUser } = setupOauth2();

				await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(externalToolService.createExternalTool).toHaveBeenCalled();
			});

			it('should return external tool with external oauth client data', async () => {
				const { externalToolDO, currentUser } = setupOauth2();

				const result: ExternalToolDO = await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('Lti11 Tool', () => {
			function ltiSetup() {
				const lti11Config: Lti11ToolConfigDO = new Lti11ToolConfigDO({
					type: ToolConfigType.LTI11,
					baseUrl: 'baseUrl',
					key: 'key',
					secret: 'secret',
					resource_link_id: 'resource_link_id',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					privacy_permission: LtiPrivacyPermission.ANONYMOUS,
				});

				return {
					lti11Config,
				};
			}

			it('should encrypt lti11 secret', async () => {
				const { lti11Config } = ltiSetup();
				const { externalToolDO, currentUser } = setup();
				const encryptedSecret = 'encryptedSecret';
				externalToolDO.config = lti11Config;
				oAuthEncryptionService.encrypt.mockReturnValue(encryptedSecret);

				await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith(
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					expect.objectContaining({ config: expect.objectContaining({ secret: encryptedSecret }) })
				);
			});

			it('should save lti11 tool', async () => {
				const { lti11Config } = ltiSetup();
				const { externalToolDO, currentUser } = setup();
				externalToolDO.config = lti11Config;

				await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(externalToolService.createExternalTool).toHaveBeenCalled();
			});

			it('should return saved lti11 tool', async () => {
				const { lti11Config } = ltiSetup();
				const { externalToolDO, currentUser } = setup();
				externalToolDO.config = lti11Config;

				const result: ExternalToolDO = await uc.createExternalTool(externalToolDO, currentUser.userId);

				expect(result).toEqual(externalToolDO);
			});
		});
	});

	describe('getExternalTool', () => {
		describe('Authorization', () => {
			it('should successfully check the user permission with the authorization service', async () => {
				const { externalToolDO, currentUser, user } = setup();

				await uc.createExternalTool(externalToolDO, currentUser);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to create an external tool', async () => {
				const { externalToolDO, currentUser } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalToolDO> = uc.createExternalTool(externalToolDO, currentUser);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should fetch a tool', async () => {
			const { currentUser, externalToolDO } = setup();
			externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

			const result: ExternalToolDO = await uc.getExternalTool(currentUser.userId, 'toolId');

			expect(result).toEqual(externalToolDO);
		});

		it('should fetch a oauth2 tool and populate the config with external data', async () => {
			const { currentUser, externalToolDO } = setupOauth2();

			const result: ExternalToolDO = await uc.getExternalTool(currentUser.userId, 'toolId');

			expect(result).toEqual(externalToolDO);
		});
	});

	describe('findExternalTool', () => {
		describe('authorizationService', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, query, options } = setup();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { currentUser, query, options, user } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});
		});

		it('should call the externalToolService', async () => {
			const { currentUser, query, options } = setup();

			await uc.findExternalTool(currentUser.userId, query, options);

			expect(externalToolService.findExternalTools).toHaveBeenCalledWith(query, options);
		});

		describe('findExternalTools with oauth2 config type', () => {
			it('should call oauthProviderService when config type is oauth2', async () => {
				const { currentUser, query, options, oauth2ConfigWithoutExternalData } = setup();
				query.config = new Oauth2ToolConfigDO({
					type: ToolConfigType.OAUTH2,
					baseUrl: 'test.de',
					clientId: 'xyz',
					skipConsent: true,
				});

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(oauthProviderService.getOAuth2Client).toHaveBeenCalledWith(oauth2ConfigWithoutExternalData.clientId);
			});

			it('should call externalToolMapper when config type is oauth2', async () => {
				const { currentUser, query, options, page, oauth2ConfigWithoutExternalData } = setup();
				query.config = new Oauth2ToolConfigDO({
					type: ToolConfigType.OAUTH2,
					baseUrl: 'test.de',
					clientId: 'xyz',
					skipConsent: true,
				});
				const oauthClient: ProviderOauthClient = {};
				externalToolService.findExternalTools.mockResolvedValue(page);
				oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(externalToolMapper.applyProviderOauthClientToDO).toHaveBeenCalledWith(
					oauth2ConfigWithoutExternalData,
					oauthClient
				);
			});
		});

		it('should return a page of externalToolDO', async () => {
			const { currentUser, query, options, page } = setup();
			externalToolService.findExternalTools.mockResolvedValue(page);

			const resultPage: Page<ExternalToolDO> = await uc.findExternalTool(currentUser.userId, query, options);

			expect(resultPage).toEqual(page);
		});
	});
});
