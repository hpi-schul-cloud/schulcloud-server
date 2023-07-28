import { setupEntities } from '@shared/testing';
import { BasicToolConfig, Lti11ToolConfig, Oauth2ToolConfig } from './config';
import { CustomParameter } from './custom-parameter';
import { ExternalTool } from './external-tool.entity';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '../../common/enum';

describe('ExternalTool Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		const setup = () => {
			const basicToolConfig: BasicToolConfig = new BasicToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			});
			const oauth2ToolConfig: Oauth2ToolConfig = new Oauth2ToolConfig({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
				clientId: 'mockClientId',
				skipConsent: true,
			});
			const lti11ToolConfig: Lti11ToolConfig = new Lti11ToolConfig({
				type: ToolConfigType.LTI11,
				baseUrl: 'mockBaseUrl',
				key: 'mockKey',
				secret: 'mockSecret',
				resource_link_id: 'mockLink',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				privacy_permission: LtiPrivacyPermission.ANONYMOUS,
			});
			const customParameter: CustomParameter = new CustomParameter({
				name: 'parameterName',
				displayName: 'User Friendly Name',
				default: 'mock',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.SCHOOL,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
				regexComment: 'mockComment',
				isOptional: false,
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
		};

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
