import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ExternalTool,
	IFindOptions,
	LtiMessageType,
	LtiPrivacyPermission,
	SortOrder,
} from '@shared/domain';
import { externalToolFactory } from '@shared/testing';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { Page } from '@shared/domain/interface/page';
import { ExternalToolService } from './external-tool.service';
import { ToolConfigType } from '../interface/tool-config-type.enum';
import { ExternalToolServiceMapper } from './mapper/external-tool-service.mapper';
import { TokenEndpointAuthMethod } from '../interface/token-endpoint-auth-method.enum';

describe('ExternalToolService', () => {
	let module: TestingModule;
	let service: ExternalToolService;

	let repo: DeepMocked<ExternalToolRepo>;
	let oauthProviderService: DeepMocked<OauthProviderService>;
	let mapper: DeepMocked<ExternalToolServiceMapper>;
	let encryptionService: DeepMocked<IEncryptionService>;

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
			],
		}).compile();

		service = module.get(ExternalToolService);
		repo = module.get(ExternalToolRepo);
		oauthProviderService = module.get(OauthProviderService);
		mapper = module.get(ExternalToolServiceMapper);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const basicToolConfigDO: BasicToolConfigDO = new BasicToolConfigDO({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockUrl',
		});
		const customParameterDO: CustomParameterDO = new CustomParameterDO({
			name: 'mockName',
			default: 'mockDefault',
			location: CustomParameterLocation.PATH,
			scope: CustomParameterScope.SCHOOL,
			type: CustomParameterType.STRING,
			regex: 'mockRegex',
		});
		const externalToolDO: ExternalToolDO = new ExternalToolDO({
			id: '1',
			name: 'mockName',
			url: 'mockUrl',
			logoUrl: 'mockLogoUrl',
			parameters: [customParameterDO],
			isHidden: true,
			openNewTab: true,
			version: 1,
			config: basicToolConfigDO,
		});

		const oauth2ToolConfigDO: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
			clientId: 'mockId',
			skipConsent: false,
			type: ToolConfigType.OAUTH2,
			baseUrl: 'mockUrl',
			scope: 'offline',
			tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
			redirectUris: ['reDir1', 'reDir2'],
			frontchannelLogoutUri: 'frontchannelLogoutUri',
		});
		const oauth2ToolConfigDOWithoutExternalData: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
			clientId: 'mockId',
			skipConsent: false,
			type: ToolConfigType.OAUTH2,
			baseUrl: 'mockUrl',
		});
		const oauthClient: ProviderOauthClient = {
			client_id: 'clientId',
			scope: 'offline',
			token_endpoint_auth_method: 'client_secret_basic',
			redirect_uris: ['reDir1', 'reDir2'],
			frontchannel_logout_uri: 'frontchannelLogoutUri',
		};

		const lti11ToolConfigDO: Lti11ToolConfigDO = new Lti11ToolConfigDO({
			type: ToolConfigType.LTI11,
			baseUrl: 'mockUrl',
			key: 'key',
			secret: 'secret',
			lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy_permission: LtiPrivacyPermission.ANONYMOUS,
		});

		const externalTool: ExternalTool = externalToolFactory.buildWithId();

		return {
			externalToolDO,
			oauth2ToolConfigDO,
			lti11ToolConfigDO,
			externalTool,
			customParameterDO,
			oauth2ToolConfigDOWithoutExternalData,
			oauthClient,
		};
	};

	describe('createExternalTool', () => {
		describe('when basic config', () => {
			it('should call the repo to save a tool', async () => {
				const { externalToolDO } = setup();
				repo.save.mockResolvedValue(externalToolDO);

				await service.createExternalTool(externalToolDO);

				expect(repo.save).toHaveBeenCalledWith(externalToolDO);
			});

			it('should save DO', async () => {
				const { externalToolDO } = setup();
				repo.save.mockResolvedValue(externalToolDO);

				const result: ExternalToolDO = await service.createExternalTool(externalToolDO);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when oauth2 config', () => {
			const setupOauth2 = () => {
				const { externalToolDO, oauth2ToolConfigDO, oauthClient } = setup();
				externalToolDO.config = oauth2ToolConfigDO;

				mapper.mapDoToProviderOauthClient.mockReturnValue(oauthClient);
				repo.save.mockResolvedValue(externalToolDO);

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

				expect(repo.save).toHaveBeenCalledWith(externalToolDO);
			});

			it('should save DO', async () => {
				const { externalToolDO } = setupOauth2();

				const result: ExternalToolDO = await service.createExternalTool(externalToolDO);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when lti11 config', () => {
			const setupLti11 = () => {
				const encryptedSecret = 'encryptedSecret';
				const { externalToolDO, lti11ToolConfigDO } = setup();
				externalToolDO.config = lti11ToolConfigDO;
				const lti11ToolConfigDOEncrypted: Lti11ToolConfigDO = { ...lti11ToolConfigDO, secret: encryptedSecret };
				const externalToolDOEncrypted: ExternalToolDO = { ...externalToolDO, config: lti11ToolConfigDOEncrypted };

				encryptionService.encrypt.mockReturnValue(encryptedSecret);
				repo.save.mockResolvedValue(externalToolDOEncrypted);

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

				expect(repo.save).toHaveBeenCalledWith(externalToolDO);
			});

			it('should save DO', async () => {
				const { externalToolDO, externalToolDOEncrypted } = setupLti11();

				const result: ExternalToolDO = await service.createExternalTool(externalToolDO);

				expect(result).toEqual(externalToolDOEncrypted);
			});
		});
	});

	describe('findExternalTool', () => {
		const setupFind = () => {
			const { externalToolDO } = setup();
			const page = new Page<ExternalToolDO>([externalToolDO], 1);
			const query: Partial<ExternalToolDO> = {
				id: 'toolId',
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

		it('should get DOs', async () => {
			const { query, options, page } = setupFind();
			repo.find.mockResolvedValue(page);

			const result: Page<ExternalToolDO> = await service.findExternalTools(query, options);

			expect(result).toEqual(page);
		});

		it('should get DOs and add external oauth2 data', async () => {
			const { query, options, page } = setupFind();
			const { externalToolDO, oauth2ToolConfigDOWithoutExternalData, oauth2ToolConfigDO, oauthClient } = setup();
			externalToolDO.config = oauth2ToolConfigDOWithoutExternalData;
			page.data = [externalToolDO];
			repo.find.mockResolvedValue(page);
			oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

			const result: Page<ExternalToolDO> = await service.findExternalTools(query, options);

			expect(result).toEqual({ data: [{ ...externalToolDO, config: oauth2ToolConfigDO }], total: 1 });
		});
	});

	describe('findExternalToolById', () => {
		it('should get DO', async () => {
			const { externalToolDO } = setup();
			repo.findById.mockResolvedValue(externalToolDO);

			const result: ExternalToolDO = await service.findExternalToolById('toolId');

			expect(result).toEqual(externalToolDO);
		});

		it('should get DO and add external oauth2 data', async () => {
			const { externalToolDO, oauth2ToolConfigDOWithoutExternalData, oauth2ToolConfigDO, oauthClient } = setup();
			externalToolDO.config = oauth2ToolConfigDOWithoutExternalData;
			repo.findById.mockResolvedValue(externalToolDO);
			oauthProviderService.getOAuth2Client.mockResolvedValue(oauthClient);

			const result: ExternalToolDO = await service.findExternalToolById('toolId');

			expect(result).toEqual({ ...externalToolDO, config: oauth2ToolConfigDO });
		});
	});

	describe('isNameUnique', () => {
		it('should find a tool with this name', async () => {
			const { externalToolDO } = setup();
			repo.findByName.mockResolvedValue(null);

			const expected: boolean = await service.isNameUnique(externalToolDO);

			expect(expected).toEqual(true);
			expect(repo.findByName).toHaveBeenCalledWith(externalToolDO.name);
		});

		it('should not find a tool with this name', async () => {
			const { externalToolDO, externalTool } = setup();
			repo.findByName.mockResolvedValue(externalTool);

			const expected: boolean = await service.isNameUnique(externalToolDO);

			expect(expected).toEqual(false);
			expect(repo.findByName).toHaveBeenCalledWith(externalToolDO.name);
		});
	});

	describe('isClientIdUnique', () => {
		it('should find a tool with this client id', async () => {
			const { oauth2ToolConfigDO } = setup();
			repo.findByOAuth2ConfigClientId.mockResolvedValue(null);

			const expected: boolean = await service.isClientIdUnique(oauth2ToolConfigDO);

			expect(expected).toEqual(true);
			expect(repo.findByOAuth2ConfigClientId).toHaveBeenCalledWith(oauth2ToolConfigDO.clientId);
		});

		it('should not find a tool with this client id', async () => {
			const { oauth2ToolConfigDO, externalTool } = setup();
			repo.findByOAuth2ConfigClientId.mockResolvedValue(externalTool);

			const expected: boolean = await service.isClientIdUnique(oauth2ToolConfigDO);

			expect(expected).toEqual(false);
			expect(repo.findByOAuth2ConfigClientId).toHaveBeenCalledWith(oauth2ToolConfigDO.clientId);
		});
	});

	describe('hasDuplicateAttributes', () => {
		it('should not find duplicate custom parameters if there are none', () => {
			const { customParameterDO } = setup();

			const expected: boolean = service.hasDuplicateAttributes([customParameterDO]);

			expect(expected).toEqual(false);
		});

		it('should find duplicate custom parameters if there are any', () => {
			const { customParameterDO } = setup();

			const expected: boolean = service.hasDuplicateAttributes([customParameterDO, customParameterDO]);

			expect(expected).toEqual(true);
		});
	});

	describe('validateByRegex', () => {
		it('should validate the regular expression', () => {
			const { customParameterDO } = setup();

			const expected: boolean = service.validateByRegex([customParameterDO]);

			expect(expected).toEqual(true);
		});

		it('should not validate a faulty regular expression', () => {
			const { customParameterDO } = setup();
			customParameterDO.regex = '[';

			const expected: boolean = service.validateByRegex([customParameterDO]);

			expect(expected).toEqual(false);
		});
	});
});
