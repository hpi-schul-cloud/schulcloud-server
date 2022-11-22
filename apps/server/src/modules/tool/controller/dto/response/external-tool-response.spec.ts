import { validate } from 'class-validator';
import { ToolConfigType } from '../../../interface/tool-config-type.enum';
import { BasicToolConfigResponse } from './basic-tool-config.response';
import { Lti11ToolConfigResponse } from './lti11-tool-config.response';
import { Oauth2ToolConfigResponse } from './oauth2-tool-config.response';
import { LtiMessageType } from '../../../interface/lti-message-type.enum';
import { CustomParameterScopeParams } from '../../../interface/custom-parameter-scope.enum';
import { CustomParameterLocationParams } from '../../../interface/custom-parameter-location.enum';
import { CustomParameterTypeParams } from '../../../interface/custom-parameter-type.enum';
import { CustomParameterResponse } from './custom-parameter.response';
import { LtiPrivacyPermission } from '../../../interface/lti-privacy-permission.enum';
import { ExternalToolResponse } from './external-tool.response';

describe('external-tool-response', () => {
	const externalToolResponseBasicConfig = new BasicToolConfigResponse({
		type: ToolConfigType.BASIC,
		baseUrl: 'mockUrl',
	});

	const externalToolResponseLti11Config = new Lti11ToolConfigResponse({
		type: ToolConfigType.LTI11,
		baseUrl: 'mockUrl',
		key: 'mockKey',
		resource_link_id: 'mockLink',
		lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
		privacy_permission: LtiPrivacyPermission.ANONYMOUS,
	});

	const externalToolResponseOauth2Config = new Oauth2ToolConfigResponse({
		type: ToolConfigType.OAUTH2,
		baseUrl: 'mockUrl',
		clientId: 'mockId',
		frontchannelLogoutUri: 'mockUrl',
		skipConsent: true,
		scope: 'mockScope',
		redirectUris: ['mockUri'],
	});

	const customParameterResponseParams: CustomParameterResponse = new CustomParameterResponse({
		name: 'mockName',
		default: 'mockDefault',
		location: CustomParameterLocationParams.QUERY,
		scope: CustomParameterScopeParams.SCHOOL,
		type: CustomParameterTypeParams.BOOLEAN,
		regex: 'mockRegex',
	});

	const externalToolResponse = new ExternalToolResponse({
		id: 'mockId',
		name: 'mockName',
		url: 'mockUrl',
		logoUrl: 'mockLogoUrl',
		config: externalToolResponseBasicConfig,
		parameters: [customParameterResponseParams],
		isHidden: true,
		openNewTab: true,
		version: 3,
	});

	it('should validate external tool response with basic config', async () => {
		const validationErrors = await validate(externalToolResponse);

		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with oauth2 config', async () => {
		const oauth2ExternalToolResponse = externalToolResponse;
		oauth2ExternalToolResponse.config = externalToolResponseOauth2Config;

		const validationErrors = await validate(oauth2ExternalToolResponse);

		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with lti11 config', async () => {
		const lti11ExternalToolResponse = externalToolResponse;
		lti11ExternalToolResponse.config = externalToolResponseLti11Config;

		const validationErrors = await validate(lti11ExternalToolResponse);

		expect(validationErrors).toHaveLength(0);
	});
});
