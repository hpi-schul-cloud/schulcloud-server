import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolResponseMapper } from '@src/modules/tool/mapper/external-tool-response.mapper';
import { CustomParameterResponse } from '@src/modules/tool/controller/dto/response/custom-parameter.response';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import { BasicToolConfigResponse } from '@src/modules/tool/controller/dto/response/basic-tool-config.response';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { Lti11ToolConfigResponse } from '@src/modules/tool/controller/dto/response/lti11-tool-config.response';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiPrivacyPermission } from '@src/modules/tool/interface/lti-privacy-permission.enum';
import { Oauth2ToolConfigResponse } from '@src/modules/tool/controller/dto/response/oauth2-tool-config.response';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';

describe('ExternalToolResponseMapper', () => {
	let module: TestingModule;
	let mapper: ExternalToolResponseMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ExternalToolResponseMapper],
		}).compile();

		mapper = module.get(ExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	function setup() {
		const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
			name: 'mockName',
			default: 'mockDefault',
			location: CustomParameterLocation.PATH,
			scope: CustomParameterScope.SCHOOL,
			type: CustomParameterType.STRING,
			regex: 'mockRegex',
		});
		const basicToolConfigResponse: BasicToolConfigResponse = new BasicToolConfigResponse({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockUrl',
		});
		const lti11ToolConfigResponse: Lti11ToolConfigResponse = new Lti11ToolConfigResponse({
			key: 'mockKey',
			lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy_permission: LtiPrivacyPermission.NAME,
			type: ToolConfigType.LTI11,
			baseUrl: 'mockUrl',
		});
		const oauth2ToolConfigResponse: Oauth2ToolConfigResponse = new Oauth2ToolConfigResponse({
			clientId: 'mockId',
			skipConsent: false,
			type: ToolConfigType.OAUTH2,
			baseUrl: 'mockUrl',
		});
		const externalToolResponse: ExternalToolResponse = new ExternalToolResponse({
			id: '1',
			name: 'mockName',
			url: 'mockUrl',
			logoUrl: 'mockLogoUrl',
			parameters: [customParameterResponse],
			isHidden: true,
			openNewTab: true,
			version: 1,
			config: basicToolConfigResponse,
		});

		const basicToolConfigDO: BasicToolConfigDO = new BasicToolConfigDO({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockUrl',
		});
		const lti11ToolConfigDO: Lti11ToolConfigDO = new Lti11ToolConfigDO({
			secret: 'mockSecret',
			key: 'mockKey',
			lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy_permission: LtiPrivacyPermission.NAME,
			type: ToolConfigType.LTI11,
			baseUrl: 'mockUrl',
		});
		const oauth2ToolConfigDO: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
			clientId: 'mockId',
			skipConsent: false,
			type: ToolConfigType.OAUTH2,
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

		return {
			externalToolResponse,
			externalToolDO,
			basicToolConfigDO,
			basicToolConfigResponse,
			lti11ToolConfigDO,
			lti11ToolConfigResponse,
			oauth2ToolConfigResponse,
			oauth2ToolConfigDO,
		};
	}

	describe('mapToResponse', () => {
		it('should map a basic tool do to a basic tool response', () => {
			const { externalToolDO, externalToolResponse, basicToolConfigDO, basicToolConfigResponse } = setup();
			externalToolDO.config = basicToolConfigDO;
			externalToolResponse.config = basicToolConfigResponse;

			const result: ExternalToolResponse = mapper.mapToResponse(externalToolDO);

			expect(result).toEqual(externalToolResponse);
		});

		it('should map a oauth2 tool do to a oauth2 tool response', () => {
			const { externalToolDO, externalToolResponse, oauth2ToolConfigDO, oauth2ToolConfigResponse } = setup();
			externalToolDO.config = oauth2ToolConfigDO;
			externalToolResponse.config = oauth2ToolConfigResponse;

			const result: ExternalToolResponse = mapper.mapToResponse(externalToolDO);

			expect(result).toEqual(externalToolResponse);
		});

		it('should map a lti11 tool do to a lti11 tool response', () => {
			const { externalToolDO, externalToolResponse, lti11ToolConfigDO, lti11ToolConfigResponse } = setup();
			externalToolDO.config = lti11ToolConfigDO;
			externalToolResponse.config = lti11ToolConfigResponse;

			const result: ExternalToolResponse = mapper.mapToResponse(externalToolDO);

			expect(result).toEqual(externalToolResponse);
		});

		it('should map a lti11 tool do to a lti11 tool response', () => {
			const { externalToolDO, externalToolResponse, lti11ToolConfigDO, lti11ToolConfigResponse } = setup();
			externalToolDO.config = lti11ToolConfigDO;
			externalToolResponse.config = lti11ToolConfigResponse;

			const result: ExternalToolResponse = mapper.mapToResponse(externalToolDO);

			expect(result).toEqual(externalToolResponse);
		});
	});
});
