import { validate } from 'class-validator';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';

describe('external-tool-response', () => {
	const externalToolConfigCreateParams = new ExternalToolConfigCreateParams();
	externalToolConfigCreateParams.type = ToolConfigType.BASIC;
	externalToolConfigCreateParams.baseUrl = 'mockUrl';

	const customParameterCreateParams = new CustomParameterCreateParams();
	customParameterCreateParams.name = 'mockName';
	customParameterCreateParams.default = 'mockDefault';
	customParameterCreateParams.location = 'mockLocation';
	customParameterCreateParams.scope = 'mockScope';
	customParameterCreateParams.type = 'mockType';
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
		const validationErrors = await validate(externalToolParams);
		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with oauth2 config', async () => {
		const oauth2ExternalToolParams = externalToolParams;
		oauth2ExternalToolParams.config.type = ToolConfigType.OAUTH2;
		const validationErrors = await validate(oauth2ExternalToolParams);
		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with oauth2 config', async () => {
		const lti11ExternalToolParams = externalToolParams;
		lti11ExternalToolParams.config.type = ToolConfigType.LTI11;
		const validationErrors = await validate(lti11ExternalToolParams);
		expect(validationErrors).toHaveLength(0);
	});
});
