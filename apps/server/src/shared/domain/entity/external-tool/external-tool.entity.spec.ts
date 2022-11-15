import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing/index';
import {
	BasicToolConfig,
	CustomParameter,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ExternalTool,
	Lti11ToolConfig,
	LtiMessageType,
	LtiRole,
	Oauth2ToolConfig,
	ToolConfigType,
} from '@shared/domain/index';

describe('ExternalTool Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		function setup() {
			const basicToolConfig: BasicToolConfig = new BasicToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			});
			const oauth2ToolConfig: Oauth2ToolConfig = new Oauth2ToolConfig({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
				clientId: 'mockClientId',
				clientSecret: 'mockClientSecret',
				skipConsent: true,
				frontchannelLogoutUri: 'mockUrl',
			});
			const lti11ToolConfig: Lti11ToolConfig = new Lti11ToolConfig({
				type: ToolConfigType.LTI11,
				baseUrl: 'mockBaseUrl',
				key: 'mockKey',
				secret: 'mockSecret',
				resource_link_id: 'mockLink',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				roles: [LtiRole.LEARNER],
				launch_presentation_locale: 'mockLocale',
				launch_presentation_document_target: 'mockTarget',
			});
			const customParameter: CustomParameter = new CustomParameter({
				name: 'parameterName',
				default: 'mock',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.SCHOOL,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
			});
			const externalTool: ExternalTool = new ExternalTool({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: basicToolConfig,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
				version: 1,
			});
			return {
				externalTool,
				oauth2ToolConfig,
				lti11ToolConfig,
			};
		}

		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new ExternalTool();
			expect(test).toThrow();
		});

		it('should create an external Tool by passing required properties', () => {
			const { externalTool } = setup();

			expect(externalTool instanceof ExternalTool).toEqual(true);
		});

		it('should create an external Tool with basic configuration by passing required properties', () => {
			const { externalTool } = setup();

			expect(externalTool.config instanceof BasicToolConfig).toEqual(true);
		});

		it('should create an external Tool with oauth2 configuration by passing required properties', () => {
			const { externalTool, oauth2ToolConfig } = setup();
			externalTool.config = oauth2ToolConfig;

			expect(externalTool.config instanceof Oauth2ToolConfig).toEqual(true);
		});

		it('should create an external Tool with LTI 1.1 configuration by passing required properties', () => {
			const { externalTool, lti11ToolConfig } = setup();
			externalTool.config = lti11ToolConfig;

			expect(externalTool.config instanceof Lti11ToolConfig).toEqual(true);
		});
	});
});
