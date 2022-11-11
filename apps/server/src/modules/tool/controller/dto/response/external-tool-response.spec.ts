import { validate } from 'class-validator';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { CustomParameterResponse } from '@src/modules/tool/controller/dto/response/custom-parameter.response';
import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { BasicToolConfigResponse } from '@src/modules/tool/controller/dto/response/basic-tool-config.response';
import { Lti11ToolConfigResponse } from '@src/modules/tool/controller/dto/response/lti11-tool-config.response';
import { Oauth2ToolConfigResponse } from '@src/modules/tool/controller/dto/response/oauth2-tool-config.response';

describe('external-tool-response', () => {
	const externalToolResponseConfig: ExternalToolConfigResponse = {
		type: ToolConfigType.BASIC,
		baseUrl: 'mockUrl',
	};

	const externalToolResponseBasicConfig = new BasicToolConfigResponse({
		type: ToolConfigType.BASIC,
		baseUrl: externalToolResponseConfig.baseUrl,
	});

	const externalToolResponseLti11Config = new Lti11ToolConfigResponse({
		type: ToolConfigType.LTI11,
		baseUrl: externalToolResponseBasicConfig.baseUrl,
		key: 'mockKey',
		secret: 'mockSecret',
		resource_link: 'mockLink',
		lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
		roles: [LtiRole.LEARNER, LtiRole.INSTRUCTOR, LtiRole.ADMINISTRATOR],
		launch_presentation_document_target: 'mockTarget',
		launch_presentation_locale: 'mockLocale',
	});

	const externalToolResponseOauth2Config = new Oauth2ToolConfigResponse({
		type: ToolConfigType.OAUTH2,
		baseUrl: externalToolResponseBasicConfig.baseUrl,
		clientId: 'mockId',
		clientSecret: 'mockSecret',
		frontchannelLogoutUrl: 'mockUrl',
		skipConsent: true,
	});

	const customParameterResponseParams: CustomParameterResponse = new CustomParameterResponse({
		name: 'mockName',
		default: 'mockDefault',
		location: [CustomParameterLocation.QUERY],
		scope: [CustomParameterScope.SCHOOL],
		type: [CustomParameterType.BOOLEAN],
		regex: 'mockRegex',
	});

	const externalToolResponse = new ExternalToolResponse({
		externalToolId: 'mockId',
		name: 'mockName',
		url: 'mockUrl',
		logoUrl: 'mockLogoUrl',
		config: externalToolResponseConfig,
		parameters: customParameterResponseParams,
		isHidden: true,
		openNewTab: true,
		version: 3,
	});

	it('should validate external tool response with basic config', async () => {
		const basicExternalToolResponse = externalToolResponse;
		basicExternalToolResponse.config = externalToolResponseBasicConfig;
		const validationErrors = await validate(basicExternalToolResponse);
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
