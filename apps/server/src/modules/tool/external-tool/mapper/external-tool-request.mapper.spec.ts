import { Test, TestingModule } from '@nestjs/testing';

import { SortOrder, SortOrderMap } from '@shared/domain/interface';
import { CustomParameter } from '../../common/domain';
import {
	CustomParameterLocation,
	CustomParameterLocationParams,
	CustomParameterScope,
	CustomParameterScopeTypeParams,
	CustomParameterType,
	CustomParameterTypeParams,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
	ToolConfigType,
} from '../../common/enum';
import { ExternalToolSearchQuery } from '../../common/interface';
import {
	BasicToolConfigParams,
	CustomParameterPostParams,
	ExternalToolCreateParams,
	ExternalToolSearchParams,
	ExternalToolSortBy,
	ExternalToolUpdateParams,
	Lti11ToolConfigCreateParams,
	Lti11ToolConfigUpdateParams,
	Oauth2ToolConfigCreateParams,
	SortExternalToolParams,
} from '../controller/dto';
import { BasicToolConfig, ExternalTool, Lti11ToolConfig, Oauth2ToolConfig } from '../domain';
import {
	basicToolConfigFactory,
	customParameterFactory,
	externalToolFactory,
	lti11ToolConfigFactory,
	oauth2ToolConfigFactory,
} from '../testing';
import { ExternalToolCreate, ExternalToolUpdate } from '../uc';
import { ExternalToolRequestMapper } from './external-tool-request.mapper';

describe('ExternalToolRequestMapper', () => {
	let module: TestingModule;
	let mapper: ExternalToolRequestMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ExternalToolRequestMapper],
		}).compile();

		mapper = module.get(ExternalToolRequestMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('mapCreateRequest', () => {
		describe('when mapping basic tool', () => {
			const setup = () => {
				const basicConfigParams = new BasicToolConfigParams();
				basicConfigParams.type = ToolConfigType.BASIC;
				basicConfigParams.baseUrl = 'mockUrl';

				const customParameterPostParams = new CustomParameterPostParams();
				customParameterPostParams.name = 'mockName';
				customParameterPostParams.displayName = 'displayName';
				customParameterPostParams.description = 'description';
				customParameterPostParams.defaultValue = 'mockDefault';
				customParameterPostParams.location = CustomParameterLocationParams.PATH;
				customParameterPostParams.scope = CustomParameterScopeTypeParams.SCHOOL;
				customParameterPostParams.type = CustomParameterTypeParams.STRING;
				customParameterPostParams.regex = 'mockRegex';
				customParameterPostParams.regexComment = 'mockComment';
				customParameterPostParams.isOptional = false;
				customParameterPostParams.isProtected = false;

				const externalToolCreateParams = new ExternalToolCreateParams();
				externalToolCreateParams.name = 'mockName';
				externalToolCreateParams.url = 'mockUrl';
				externalToolCreateParams.logoUrl = 'mockLogoUrl';
				externalToolCreateParams.parameters = [customParameterPostParams];
				externalToolCreateParams.isHidden = true;
				externalToolCreateParams.openNewTab = true;
				externalToolCreateParams.config = basicConfigParams;
				externalToolCreateParams.isDeactivated = true;
				externalToolCreateParams.description = 'description';

				const customParameterDO: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const basicToolConfigDO: BasicToolConfig = basicToolConfigFactory.build({
					type: ToolConfigType.BASIC,
					baseUrl: 'mockUrl',
				});

				const externalToolDOCreate: ExternalTool = externalToolFactory.build({
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameterDO],
					isHidden: true,
					openNewTab: true,
					config: basicToolConfigDO,
					isDeactivated: true,
					createdAt: undefined,
				});

				return {
					externalToolCreateParams,
					externalToolDOCreate,
					customParameterDO,
				};
			};

			it('should map the request to external tool DO with basicConfig', () => {
				const { externalToolCreateParams, externalToolDOCreate, customParameterDO } = setup();

				const result = mapper.mapCreateRequest(externalToolCreateParams);

				expect(result).toEqual<ExternalToolCreate>({
					name: externalToolDOCreate.name,
					description: externalToolDOCreate.description,
					url: externalToolDOCreate.url,
					logoUrl: externalToolDOCreate.logoUrl,
					parameters: [
						{
							name: customParameterDO.name,
							displayName: customParameterDO.displayName,
							description: customParameterDO.description,
							default: customParameterDO.default,
							location: customParameterDO.location,
							scope: customParameterDO.scope,
							type: customParameterDO.type,
							regex: customParameterDO.regex,
							regexComment: customParameterDO.regexComment,
							isOptional: customParameterDO.isOptional,
							isProtected: customParameterDO.isProtected,
						},
					],
					isHidden: true,
					openNewTab: true,
					config: {
						type: ToolConfigType.BASIC,
						baseUrl: 'mockUrl',
					},
					isDeactivated: externalToolDOCreate.isDeactivated,
					createdAt: externalToolDOCreate.createdAt,
					medium: externalToolDOCreate.medium,
					restrictToContexts: externalToolDOCreate.restrictToContexts,
				});
			});
		});

		describe('when mapping lti tool', () => {
			const setup = () => {
				const lti11ConfigParams = new Lti11ToolConfigCreateParams();
				lti11ConfigParams.type = ToolConfigType.LTI11;
				lti11ConfigParams.baseUrl = 'mockUrl';
				lti11ConfigParams.key = 'mockKey';
				lti11ConfigParams.secret = 'mockSecret';
				lti11ConfigParams.lti_message_type = LtiMessageType.BASIC_LTI_LAUNCH_REQUEST;
				lti11ConfigParams.privacy_permission = LtiPrivacyPermission.NAME;
				lti11ConfigParams.launch_presentation_locale = 'de-DE';

				const lti11ToolConfigDO: Lti11ToolConfig = new Lti11ToolConfig({
					privacy_permission: LtiPrivacyPermission.NAME,
					secret: 'mockSecret',
					key: 'mockKey',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					type: ToolConfigType.LTI11,
					baseUrl: 'mockUrl',
					launch_presentation_locale: 'de-DE',
				});

				const customParameterPostParams = new CustomParameterPostParams();
				customParameterPostParams.name = 'mockName';
				customParameterPostParams.displayName = 'displayName';
				customParameterPostParams.description = 'description';
				customParameterPostParams.defaultValue = 'mockDefault';
				customParameterPostParams.location = CustomParameterLocationParams.PATH;
				customParameterPostParams.scope = CustomParameterScopeTypeParams.SCHOOL;
				customParameterPostParams.type = CustomParameterTypeParams.STRING;
				customParameterPostParams.regex = 'mockRegex';
				customParameterPostParams.regexComment = 'mockComment';
				customParameterPostParams.isOptional = false;
				customParameterPostParams.isProtected = false;

				const externalToolCreateParams = new ExternalToolCreateParams();
				externalToolCreateParams.name = 'mockName';
				externalToolCreateParams.url = 'mockUrl';
				externalToolCreateParams.logoUrl = 'mockLogoUrl';
				externalToolCreateParams.parameters = [customParameterPostParams];
				externalToolCreateParams.isHidden = true;
				externalToolCreateParams.openNewTab = true;
				externalToolCreateParams.config = lti11ConfigParams;
				externalToolCreateParams.isDeactivated = false;
				externalToolCreateParams.description = 'description';

				const customParameterDO: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const externalToolDOCreate: ExternalTool = externalToolFactory.build({
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameterDO],
					isHidden: true,
					openNewTab: true,
					config: lti11ToolConfigDO,
					isDeactivated: false,
					createdAt: undefined,
				});

				return {
					externalToolCreateParams,
					externalToolDOCreate,
					customParameterDO,
					lti11ToolConfigDO,
				};
			};

			it('should map the request to external tool DO with lti11 config', () => {
				const { externalToolCreateParams, externalToolDOCreate, customParameterDO, lti11ToolConfigDO } = setup();

				const result = mapper.mapCreateRequest(externalToolCreateParams);

				expect(result).toEqual<ExternalToolCreate>({
					name: externalToolDOCreate.name,
					description: externalToolDOCreate.description,
					url: externalToolDOCreate.url,
					logoUrl: externalToolDOCreate.logoUrl,
					parameters: [
						{
							name: customParameterDO.name,
							displayName: customParameterDO.displayName,
							description: customParameterDO.description,
							default: customParameterDO.default,
							location: customParameterDO.location,
							scope: customParameterDO.scope,
							type: customParameterDO.type,
							regex: customParameterDO.regex,
							regexComment: customParameterDO.regexComment,
							isOptional: customParameterDO.isOptional,
							isProtected: customParameterDO.isProtected,
						},
					],
					isHidden: externalToolDOCreate.isHidden,
					openNewTab: externalToolDOCreate.openNewTab,
					config: {
						privacy_permission: lti11ToolConfigDO.privacy_permission,
						secret: lti11ToolConfigDO.secret,
						key: lti11ToolConfigDO.key,
						lti_message_type: lti11ToolConfigDO.lti_message_type,
						type: lti11ToolConfigDO.type,
						baseUrl: lti11ToolConfigDO.baseUrl,
						launch_presentation_locale: lti11ToolConfigDO.launch_presentation_locale,
					},
					isDeactivated: externalToolDOCreate.isDeactivated,
					createdAt: externalToolDOCreate.createdAt,
					medium: externalToolDOCreate.medium,
					restrictToContexts: externalToolDOCreate.restrictToContexts,
				});
			});
		});

		describe('when mapping oauth tool', () => {
			const setup = () => {
				const oauth2ConfigParams = new Oauth2ToolConfigCreateParams();
				oauth2ConfigParams.type = ToolConfigType.OAUTH2;
				oauth2ConfigParams.baseUrl = 'mockUrl';
				oauth2ConfigParams.clientId = 'mockId';
				oauth2ConfigParams.clientSecret = 'mockSecret';
				oauth2ConfigParams.frontchannelLogoutUri = 'mockUrl';
				oauth2ConfigParams.skipConsent = true;
				oauth2ConfigParams.scope = 'mockScope';
				oauth2ConfigParams.redirectUris = ['mockUri'];
				oauth2ConfigParams.tokenEndpointAuthMethod = TokenEndpointAuthMethod.CLIENT_SECRET_POST;

				const oauth2ToolConfigDO: Oauth2ToolConfig = oauth2ToolConfigFactory.build({
					clientId: 'mockId',
					type: ToolConfigType.OAUTH2,
					baseUrl: 'mockUrl',
					clientSecret: 'mockSecret',
					frontchannelLogoutUri: 'mockUrl',
					skipConsent: true,
					scope: 'mockScope',
					redirectUris: ['mockUri'],
					tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
				});

				const customParameterPostParams = new CustomParameterPostParams();
				customParameterPostParams.name = 'mockName';
				customParameterPostParams.displayName = 'displayName';
				customParameterPostParams.description = 'description';
				customParameterPostParams.defaultValue = 'mockDefault';
				customParameterPostParams.location = CustomParameterLocationParams.PATH;
				customParameterPostParams.scope = CustomParameterScopeTypeParams.SCHOOL;
				customParameterPostParams.type = CustomParameterTypeParams.STRING;
				customParameterPostParams.regex = 'mockRegex';
				customParameterPostParams.regexComment = 'mockComment';
				customParameterPostParams.isOptional = false;
				customParameterPostParams.isProtected = false;

				const externalToolCreateParams = new ExternalToolCreateParams();
				externalToolCreateParams.name = 'mockName';
				externalToolCreateParams.url = 'mockUrl';
				externalToolCreateParams.logoUrl = 'mockLogoUrl';
				externalToolCreateParams.parameters = [customParameterPostParams];
				externalToolCreateParams.isHidden = true;
				externalToolCreateParams.openNewTab = true;
				externalToolCreateParams.config = oauth2ConfigParams;
				externalToolCreateParams.isDeactivated = false;
				externalToolCreateParams.description = 'description';

				const customParameterDO: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const externalToolDOCreate: ExternalTool = externalToolFactory.build({
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameterDO],
					isHidden: true,
					openNewTab: true,
					config: oauth2ToolConfigDO,
					isDeactivated: false,
					createdAt: undefined,
				});

				return {
					externalToolCreateParams,
					externalToolDOCreate,
					customParameterDO,
					oauth2ToolConfigDO,
				};
			};

			it('should map the request to external tool DO with oauth2', () => {
				const { externalToolCreateParams, externalToolDOCreate, customParameterDO, oauth2ToolConfigDO } = setup();

				const result = mapper.mapCreateRequest(externalToolCreateParams);

				expect(result).toEqual<ExternalToolCreate>({
					name: externalToolDOCreate.name,
					description: externalToolDOCreate.description,
					url: externalToolDOCreate.url,
					logoUrl: externalToolDOCreate.logoUrl,
					parameters: [
						{
							name: customParameterDO.name,
							displayName: customParameterDO.displayName,
							description: customParameterDO.description,
							default: customParameterDO.default,
							location: customParameterDO.location,
							scope: customParameterDO.scope,
							type: customParameterDO.type,
							regex: customParameterDO.regex,
							regexComment: customParameterDO.regexComment,
							isOptional: customParameterDO.isOptional,
							isProtected: customParameterDO.isProtected,
						},
					],
					isHidden: externalToolDOCreate.isHidden,
					openNewTab: externalToolDOCreate.openNewTab,
					config: {
						clientId: oauth2ToolConfigDO.clientId,
						type: oauth2ToolConfigDO.type,
						baseUrl: oauth2ToolConfigDO.baseUrl,
						clientSecret: oauth2ToolConfigDO.clientSecret,
						frontchannelLogoutUri: oauth2ToolConfigDO.frontchannelLogoutUri,
						skipConsent: oauth2ToolConfigDO.skipConsent,
						scope: oauth2ToolConfigDO.scope,
						redirectUris: oauth2ToolConfigDO.redirectUris,
						tokenEndpointAuthMethod: oauth2ToolConfigDO.tokenEndpointAuthMethod,
					},
					isDeactivated: externalToolDOCreate.isDeactivated,
					createdAt: externalToolDOCreate.createdAt,
					medium: externalToolDOCreate.medium,
					restrictToContexts: externalToolDOCreate.restrictToContexts,
				});
			});
		});
	});

	describe('mapUpdateRequest', () => {
		describe('when mapping basic tool', () => {
			const setup = () => {
				const basicConfigParams = new BasicToolConfigParams();
				basicConfigParams.type = ToolConfigType.BASIC;
				basicConfigParams.baseUrl = 'mockUrl';

				const customParameterPostParams = new CustomParameterPostParams();
				customParameterPostParams.name = 'mockName';
				customParameterPostParams.displayName = 'displayName';
				customParameterPostParams.description = 'description';
				customParameterPostParams.defaultValue = 'mockDefault';
				customParameterPostParams.location = CustomParameterLocationParams.PATH;
				customParameterPostParams.scope = CustomParameterScopeTypeParams.SCHOOL;
				customParameterPostParams.type = CustomParameterTypeParams.STRING;
				customParameterPostParams.regex = 'mockRegex';
				customParameterPostParams.regexComment = 'mockComment';
				customParameterPostParams.isOptional = false;
				customParameterPostParams.isProtected = false;

				const externalToolUpdateParams = new ExternalToolUpdateParams();
				externalToolUpdateParams.id = 'id';
				externalToolUpdateParams.name = 'mockName';
				externalToolUpdateParams.url = 'mockUrl';
				externalToolUpdateParams.logoUrl = 'mockLogoUrl';
				externalToolUpdateParams.parameters = [customParameterPostParams];
				externalToolUpdateParams.isHidden = true;
				externalToolUpdateParams.openNewTab = true;
				externalToolUpdateParams.config = basicConfigParams;
				externalToolUpdateParams.isDeactivated = false;
				externalToolUpdateParams.description = 'description';

				const customParameterDO: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const basicToolConfigDO: BasicToolConfig = basicToolConfigFactory.build({
					type: ToolConfigType.BASIC,
					baseUrl: 'mockUrl',
				});

				const externalToolDOUpdate: ExternalTool = externalToolFactory.buildWithId(
					{
						name: 'mockName',
						url: 'mockUrl',
						logoUrl: 'mockLogoUrl',
						parameters: [customParameterDO],
						isHidden: true,
						openNewTab: true,
						config: basicToolConfigDO,
						isDeactivated: false,
						createdAt: undefined,
					},
					externalToolUpdateParams.id
				);

				return {
					externalToolUpdateParams,
					externalToolDOUpdate,
					customParameterDO,
				};
			};

			it('should map the request to external tool DO with basicConfig', () => {
				const { externalToolUpdateParams, externalToolDOUpdate, customParameterDO } = setup();

				const result = mapper.mapUpdateRequest(externalToolUpdateParams);

				expect(result).toEqual<ExternalToolUpdate>({
					id: externalToolDOUpdate.id,
					name: externalToolDOUpdate.name,
					description: externalToolDOUpdate.description,
					url: externalToolDOUpdate.url,
					logoUrl: externalToolDOUpdate.logoUrl,
					parameters: [
						{
							name: customParameterDO.name,
							displayName: customParameterDO.displayName,
							description: customParameterDO.description,
							default: customParameterDO.default,
							location: customParameterDO.location,
							scope: customParameterDO.scope,
							type: customParameterDO.type,
							regex: customParameterDO.regex,
							regexComment: customParameterDO.regexComment,
							isOptional: customParameterDO.isOptional,
							isProtected: customParameterDO.isProtected,
						},
					],
					isHidden: true,
					openNewTab: true,
					config: {
						type: ToolConfigType.BASIC,
						baseUrl: 'mockUrl',
					},
					isDeactivated: externalToolDOUpdate.isDeactivated,
					createdAt: externalToolDOUpdate.createdAt,
					medium: externalToolDOUpdate.medium,
					restrictToContexts: externalToolDOUpdate.restrictToContexts,
				});
			});
		});

		describe('when mapping lti tool', () => {
			const setup = () => {
				const lti11ConfigParams = new Lti11ToolConfigUpdateParams();
				lti11ConfigParams.type = ToolConfigType.LTI11;
				lti11ConfigParams.baseUrl = 'mockUrl';
				lti11ConfigParams.key = 'mockKey';
				lti11ConfigParams.secret = 'mockSecret';
				lti11ConfigParams.lti_message_type = LtiMessageType.BASIC_LTI_LAUNCH_REQUEST;
				lti11ConfigParams.privacy_permission = LtiPrivacyPermission.NAME;
				lti11ConfigParams.launch_presentation_locale = 'de-DE';

				const lti11ToolConfigDO: Lti11ToolConfig = lti11ToolConfigFactory.build({
					privacy_permission: LtiPrivacyPermission.NAME,
					secret: 'mockSecret',
					key: 'mockKey',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					type: ToolConfigType.LTI11,
					baseUrl: 'mockUrl',
					launch_presentation_locale: 'de-DE',
				});

				const customParameterPostParams = new CustomParameterPostParams();
				customParameterPostParams.name = 'mockName';
				customParameterPostParams.displayName = 'displayName';
				customParameterPostParams.description = 'description';
				customParameterPostParams.defaultValue = 'mockDefault';
				customParameterPostParams.location = CustomParameterLocationParams.PATH;
				customParameterPostParams.scope = CustomParameterScopeTypeParams.SCHOOL;
				customParameterPostParams.type = CustomParameterTypeParams.STRING;
				customParameterPostParams.regex = 'mockRegex';
				customParameterPostParams.regexComment = 'mockComment';
				customParameterPostParams.isOptional = false;
				customParameterPostParams.isProtected = false;

				const externalToolUpdateParams = new ExternalToolUpdateParams();
				externalToolUpdateParams.id = 'id';
				externalToolUpdateParams.name = 'mockName';
				externalToolUpdateParams.url = 'mockUrl';
				externalToolUpdateParams.logoUrl = 'mockLogoUrl';
				externalToolUpdateParams.parameters = [customParameterPostParams];
				externalToolUpdateParams.isHidden = true;
				externalToolUpdateParams.openNewTab = true;
				externalToolUpdateParams.config = lti11ConfigParams;
				externalToolUpdateParams.isDeactivated = false;
				externalToolUpdateParams.description = 'description';

				const customParameterDO: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const externalToolDOUpdate: ExternalTool = externalToolFactory.buildWithId(
					{
						name: 'mockName',
						url: 'mockUrl',
						logoUrl: 'mockLogoUrl',
						parameters: [customParameterDO],
						isHidden: true,
						openNewTab: true,
						config: lti11ToolConfigDO,
						isDeactivated: false,
						createdAt: undefined,
					},
					externalToolUpdateParams.id
				);

				return {
					externalToolUpdateParams,
					externalToolDOUpdate,
					customParameterDO,
					lti11ToolConfigDO,
				};
			};

			it('should map the request to external tool DO with lti11 config', () => {
				const { externalToolUpdateParams, externalToolDOUpdate, customParameterDO, lti11ToolConfigDO } = setup();

				const result = mapper.mapUpdateRequest(externalToolUpdateParams);

				expect(result).toEqual<ExternalToolUpdate>({
					id: externalToolDOUpdate.id,
					name: externalToolDOUpdate.name,
					description: externalToolDOUpdate.description,
					url: externalToolDOUpdate.url,
					logoUrl: externalToolDOUpdate.logoUrl,
					parameters: [
						{
							name: customParameterDO.name,
							displayName: customParameterDO.displayName,
							description: customParameterDO.description,
							default: customParameterDO.default,
							location: customParameterDO.location,
							scope: customParameterDO.scope,
							type: customParameterDO.type,
							regex: customParameterDO.regex,
							regexComment: customParameterDO.regexComment,
							isOptional: customParameterDO.isOptional,
							isProtected: customParameterDO.isProtected,
						},
					],
					isHidden: externalToolDOUpdate.isHidden,
					openNewTab: externalToolDOUpdate.openNewTab,
					config: {
						privacy_permission: lti11ToolConfigDO.privacy_permission,
						secret: lti11ToolConfigDO.secret,
						key: lti11ToolConfigDO.key,
						lti_message_type: lti11ToolConfigDO.lti_message_type,
						type: lti11ToolConfigDO.type,
						baseUrl: lti11ToolConfigDO.baseUrl,
						launch_presentation_locale: lti11ToolConfigDO.launch_presentation_locale,
					},
					isDeactivated: externalToolDOUpdate.isDeactivated,
					createdAt: externalToolDOUpdate.createdAt,
					medium: externalToolDOUpdate.medium,
					restrictToContexts: externalToolDOUpdate.restrictToContexts,
				});
			});
		});

		describe('when mapping oauth tool', () => {
			const setup = () => {
				const oauth2ConfigParams = new Oauth2ToolConfigCreateParams();
				oauth2ConfigParams.type = ToolConfigType.OAUTH2;
				oauth2ConfigParams.baseUrl = 'mockUrl';
				oauth2ConfigParams.clientId = 'mockId';
				oauth2ConfigParams.clientSecret = 'mockSecret';
				oauth2ConfigParams.frontchannelLogoutUri = 'mockUrl';
				oauth2ConfigParams.skipConsent = true;
				oauth2ConfigParams.scope = 'mockScope';
				oauth2ConfigParams.redirectUris = ['mockUri'];
				oauth2ConfigParams.tokenEndpointAuthMethod = TokenEndpointAuthMethod.CLIENT_SECRET_POST;

				const oauth2ToolConfigDO: Oauth2ToolConfig = oauth2ToolConfigFactory.build({
					clientId: 'mockId',
					type: ToolConfigType.OAUTH2,
					baseUrl: 'mockUrl',
					clientSecret: 'mockSecret',
					frontchannelLogoutUri: 'mockUrl',
					skipConsent: true,
					scope: 'mockScope',
					redirectUris: ['mockUri'],
					tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
				});

				const customParameterPostParams = new CustomParameterPostParams();
				customParameterPostParams.name = 'mockName';
				customParameterPostParams.displayName = 'displayName';
				customParameterPostParams.description = 'description';
				customParameterPostParams.defaultValue = 'mockDefault';
				customParameterPostParams.location = CustomParameterLocationParams.PATH;
				customParameterPostParams.scope = CustomParameterScopeTypeParams.SCHOOL;
				customParameterPostParams.type = CustomParameterTypeParams.STRING;
				customParameterPostParams.regex = 'mockRegex';
				customParameterPostParams.regexComment = 'mockComment';
				customParameterPostParams.isOptional = false;
				customParameterPostParams.isProtected = false;

				const externalToolUpdateParams = new ExternalToolUpdateParams();
				externalToolUpdateParams.id = 'id';
				externalToolUpdateParams.name = 'mockName';
				externalToolUpdateParams.url = 'mockUrl';
				externalToolUpdateParams.logoUrl = 'mockLogoUrl';
				externalToolUpdateParams.parameters = [customParameterPostParams];
				externalToolUpdateParams.isHidden = true;
				externalToolUpdateParams.openNewTab = true;
				externalToolUpdateParams.config = oauth2ConfigParams;
				externalToolUpdateParams.isDeactivated = false;
				externalToolUpdateParams.description = 'description';

				const customParameterDO: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const externalToolDOUpdate: ExternalTool = externalToolFactory.buildWithId(
					{
						name: 'mockName',
						url: 'mockUrl',
						logoUrl: 'mockLogoUrl',
						parameters: [customParameterDO],
						isHidden: true,
						openNewTab: true,
						config: oauth2ToolConfigDO,
						isDeactivated: false,
						createdAt: undefined,
					},
					externalToolUpdateParams.id
				);

				return {
					externalToolUpdateParams,
					externalToolDOUpdate,
					customParameterDO,
					oauth2ToolConfigDO,
				};
			};

			it('should map the request to external tool DO with oauth2', () => {
				const { externalToolUpdateParams, externalToolDOUpdate, customParameterDO, oauth2ToolConfigDO } = setup();

				const result = mapper.mapUpdateRequest(externalToolUpdateParams);

				expect(result).toEqual<ExternalToolUpdate>({
					id: externalToolDOUpdate.id,
					name: externalToolDOUpdate.name,
					description: externalToolDOUpdate.description,
					url: externalToolDOUpdate.url,
					logoUrl: externalToolDOUpdate.logoUrl,
					parameters: [
						{
							name: customParameterDO.name,
							displayName: customParameterDO.displayName,
							description: customParameterDO.description,
							default: customParameterDO.default,
							location: customParameterDO.location,
							scope: customParameterDO.scope,
							type: customParameterDO.type,
							regex: customParameterDO.regex,
							regexComment: customParameterDO.regexComment,
							isOptional: customParameterDO.isOptional,
							isProtected: customParameterDO.isProtected,
						},
					],
					isHidden: externalToolDOUpdate.isHidden,
					openNewTab: externalToolDOUpdate.openNewTab,
					config: {
						clientId: oauth2ToolConfigDO.clientId,
						type: oauth2ToolConfigDO.type,
						baseUrl: oauth2ToolConfigDO.baseUrl,
						clientSecret: oauth2ToolConfigDO.clientSecret,
						frontchannelLogoutUri: oauth2ToolConfigDO.frontchannelLogoutUri,
						skipConsent: oauth2ToolConfigDO.skipConsent,
						scope: oauth2ToolConfigDO.scope,
						redirectUris: oauth2ToolConfigDO.redirectUris,
						tokenEndpointAuthMethod: oauth2ToolConfigDO.tokenEndpointAuthMethod,
					},
					isDeactivated: externalToolDOUpdate.isDeactivated,
					createdAt: externalToolDOUpdate.createdAt,
					medium: externalToolDOUpdate.medium,
					restrictToContexts: externalToolDOUpdate.restrictToContexts,
				});
			});
		});
	});

	describe('mapSortingQueryToDomain', () => {
		describe('when sortBy is given', () => {
			const setup = () => {
				const sortingQuery: SortExternalToolParams = {
					sortBy: ExternalToolSortBy.ID,
					sortOrder: SortOrder.asc,
				};

				return { sortingQuery };
			};

			it('should map controller sorting query to domain sort order map', () => {
				const { sortingQuery } = setup();

				const result: SortOrderMap<ExternalTool> | undefined = mapper.mapSortingQueryToDomain(sortingQuery);

				expect(result).toEqual({ id: SortOrder.asc });
			});
		});

		describe('when sortBy is not given', () => {
			const setup = () => {
				const sortingQuery: SortExternalToolParams = {
					sortOrder: SortOrder.asc,
				};

				return { sortingQuery };
			};

			it('should map controller sorting query to undefined', () => {
				const { sortingQuery } = setup();

				const result: SortOrderMap<ExternalTool> | undefined = mapper.mapSortingQueryToDomain(sortingQuery);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('mapExternalToolFilterQueryToExternalToolSearchQuery', () => {
		const setup = () => {
			const params: ExternalToolSearchParams = {
				name: 'name',
				clientId: 'clientId',
			};

			return { params };
		};

		it('should map params to a search query', () => {
			const { params } = setup();

			const result: ExternalToolSearchQuery = mapper.mapExternalToolFilterQueryToExternalToolSearchQuery(params);

			expect(result).toEqual(params);
		});
	});
});
