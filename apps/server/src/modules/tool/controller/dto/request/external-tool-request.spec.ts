import { validate } from 'class-validator';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';
import { BasicToolConfigParams } from '@src/modules/tool/controller/dto/request/basic-tool-config.params';
import { Lti11ToolConfigParams } from '@src/modules/tool/controller/dto/request/lti11-tool-config.params';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { Oauth2ToolConfigParams } from '@src/modules/tool/controller/dto/request/oauth2-tool-config.params';

describe('external-tool-request', () => {
	const externalToolConfigCreateParams = new ExternalToolConfigCreateParams();
	externalToolConfigCreateParams.type = ToolConfigType.BASIC;
	externalToolConfigCreateParams.baseUrl = 'mockUrl';

	const externalToolConfigCreateBasicParams = new BasicToolConfigParams({
		type: ToolConfigType.BASIC,
		baseUrl: externalToolConfigCreateParams.baseUrl,
	});

	const externalToolConfigCreateLti11Params = new Lti11ToolConfigParams({
		type: ToolConfigType.LTI11,
		baseUrl: externalToolConfigCreateParams.baseUrl,
		key: 'mockKey',
		secret: 'mockSecret',
		resource_link: 'mockLink',
		lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
		roles: [LtiRole.LEARNER, LtiRole.INSTRUCTOR, LtiRole.ADMINISTRATOR],
		launch_presentation_document_target: 'mockTarget',
		launch_presentation_locale: 'mockLocale',
	});

	const externalToolConfigCreateOauthParams = new Oauth2ToolConfigParams({
		type: ToolConfigType.OAUTH2,
		baseUrl: externalToolConfigCreateParams.baseUrl,
		clientId: 'mockId',
		clientSecret: 'mockSecret',
		frontchannelLogoutUrl: 'mockUrl',
		skipConsent: true,
	});

	const customParameterCreateParams = new CustomParameterCreateParams();
	customParameterCreateParams.name = 'mockName';
	customParameterCreateParams.default = 'mockDefault';
	customParameterCreateParams.location = CustomParameterLocation.PATH;
	customParameterCreateParams.scope = CustomParameterScope.SCHOOL;
	customParameterCreateParams.type = CustomParameterType.STRING;
	customParameterCreateParams.regex = 'mockRegex';

	const externalToolParams = new ExternalToolParams();
	externalToolParams.name = 'mockName';
	externalToolParams.url = 'mockUrl';
	externalToolParams.logoUrl = 'mockLogoUrl';
	externalToolParams.config = externalToolConfigCreateParams;
	externalToolParams.parameters = [customParameterCreateParams];
	externalToolParams.isHidden = true;
	externalToolParams.openNewTab = true;
	externalToolParams.version = 3;

	it('should validate external tool response with basic config', async () => {
		const basicExternalToolParams = externalToolParams;
		basicExternalToolParams.config = externalToolConfigCreateBasicParams;
		const validationErrors = await validate(basicExternalToolParams);
		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with oauth2 config', async () => {
		const oauth2ExternalToolParams = externalToolParams;
		oauth2ExternalToolParams.config = externalToolConfigCreateOauthParams;
		const validationErrors = await validate(oauth2ExternalToolParams);
		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with lti11 config', async () => {
		const lti11ExternalToolParams = externalToolParams;
		lti11ExternalToolParams.config = externalToolConfigCreateLti11Params;
		const validationErrors = await validate(lti11ExternalToolParams);
		expect(validationErrors).toHaveLength(0);
	});
});
