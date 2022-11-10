import { validate } from 'class-validator';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';
import { ExternalToolConfigResponseParams } from '@src/modules/tool/controller/dto/response/external-tool-config-response.params';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { CustomParameterResponseParams } from '@src/modules/tool/controller/dto/response/custom-parameter-response.params';

const externalToolResponseConfig: ExternalToolConfigResponseParams = {
	type: ToolConfigType.BASIC,
	baseUrl: 'mockUrl',
};

const customParameterResponseParams: CustomParameterResponseParams = {
	name: 'mockName',
	default: 'mockDefault',
	location: ['mockLocation'],
	scope: ['mockScope'],
	type: ['mockType'],
	regex: 'mockRegex',
};

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

describe('external-tool-response', () => {
	it('should validate external tool response with basic config', async () => {
		const validationErrors = await validate(externalToolResponse);
		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with oauth2 config', async () => {
		const oauth2ExternalToolResponse = externalToolResponse;
		oauth2ExternalToolResponse.config.type = ToolConfigType.OAUTH2;
		const validationErrors = await validate(oauth2ExternalToolResponse);
		expect(validationErrors).toHaveLength(0);
	});

	it('should validate external tool response with oauth2 config', async () => {
		const lti11ExternalToolResponse = externalToolResponse;
		lti11ExternalToolResponse.config.type = ToolConfigType.LTI11;
		const validationErrors = await validate(lti11ExternalToolResponse);
		expect(validationErrors).toHaveLength(0);
	});
});
