import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { NotImplementedException } from '@nestjs/common';
import { ToolController } from './tool.controller';
import { Lti11Uc } from '../uc/lti11.uc';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { BasicToolConfigParams } from './dto/request/basic-tool-config.params';
import { ToolConfigType } from '../interface/tool-config-type.enum';
import { LtiMessageType } from '../interface/lti-message-type.enum';
import { Oauth2ToolConfigParams } from './dto/request/oauth2-tool-config.params';
import { CustomParameterLocation } from '../interface/custom-parameter-location.enum';
import { CustomParameterScope } from '../interface/custom-parameter-scope.enum';
import { CustomParameterType } from '../interface/custom-parameter-type.enum';
import { CustomParameterCreateParams } from './dto/request/custom-parameter.params';
import { Lti11ToolConfigParams } from './dto/request/lti11-tool-config.params';
import { ExternalToolParams } from './dto/request/external-tool-create.params';

describe('ToolController', () => {
	let module: TestingModule;
	let controller: ToolController;

	let lti11Uc: DeepMocked<Lti11Uc>;
	let lti11ResponseMapper: DeepMocked<Lti11ResponseMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolController,
				{
					provide: Lti11Uc,
					useValue: createMock<Lti11Uc>(),
				},
				{
					provide: Lti11ResponseMapper,
					useValue: createMock<Lti11ResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(ToolController);
		lti11Uc = module.get(Lti11Uc);
		lti11ResponseMapper = module.get(Lti11ResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLti11LaunchParameters', () => {
		it('should fetch the authorized launch parameters and return the response', async () => {
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const toolId = 'toolId';
			const courseId = 'courseId';
			const authorization: Authorization = {
				oauth_consumer_key: 'key',
				oauth_nonce: 'nonce',
				oauth_body_hash: 'body_hash',
				oauth_signature: 'signature',
				oauth_timestamp: 100,
				oauth_token: 'token',
				oauth_version: 'version',
				oauth_signature_method: 'signature_method',
			};

			lti11Uc.getLaunchParameters.mockResolvedValue(authorization);
			lti11ResponseMapper.mapAuthorizationToResponse.mockReturnValue(new Lti11LaunchResponse(authorization));

			const result: Lti11LaunchResponse = await controller.getLti11LaunchParameters(
				currentUser,
				{ toolId },
				{ courseId }
			);

			expect(result).toEqual(expect.objectContaining(authorization));
			expect(lti11Uc.getLaunchParameters).toHaveBeenCalledWith(currentUser, toolId, courseId);
		});
	});

	describe('createExternalTool', () => {
		function setup() {
			const bodyConfigCreateBasicParams = new BasicToolConfigParams();
			bodyConfigCreateBasicParams.type = ToolConfigType.BASIC;
			bodyConfigCreateBasicParams.baseUrl = 'mockUrl';

			const bodyConfigCreateLti11Params = new Lti11ToolConfigParams();
			bodyConfigCreateLti11Params.type = ToolConfigType.LTI11;
			bodyConfigCreateLti11Params.baseUrl = 'mockUrl';
			bodyConfigCreateLti11Params.key = 'mockKey';
			bodyConfigCreateLti11Params.secret = 'mockSecret';
			bodyConfigCreateLti11Params.resource_link_id = 'mockLink';
			bodyConfigCreateLti11Params.lti_message_type = LtiMessageType.BASIC_LTI_LAUNCH_REQUEST;

			const bodyConfigCreateOauthParams = new Oauth2ToolConfigParams();
			bodyConfigCreateOauthParams.type = ToolConfigType.OAUTH2;
			bodyConfigCreateOauthParams.baseUrl = 'mockUrl';
			bodyConfigCreateOauthParams.clientId = 'mockId';
			bodyConfigCreateOauthParams.clientSecret = 'mockSecret';
			bodyConfigCreateOauthParams.frontchannelLogoutUri = 'mockUrl';
			bodyConfigCreateOauthParams.skipConsent = true;
			bodyConfigCreateOauthParams.scope = 'mockScope';
			bodyConfigCreateOauthParams.redirectUris = ['mockUri'];

			const customParameterCreateParams = new CustomParameterCreateParams();
			customParameterCreateParams.name = 'mockName';
			customParameterCreateParams.default = 'mockDefault';
			customParameterCreateParams.location = CustomParameterLocation.PATH;
			customParameterCreateParams.scope = CustomParameterScope.SCHOOL;
			customParameterCreateParams.type = CustomParameterType.STRING;
			customParameterCreateParams.regex = 'mockRegex';

			const body = new ExternalToolParams();
			body.name = 'mockName';
			body.url = 'mockUrl';
			body.logoUrl = 'mockLogoUrl';
			body.parameters = [customParameterCreateParams];
			body.isHidden = true;
			body.openNewTab = true;

			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

			return {
				body,
				bodyConfigCreateBasicParams,
				bodyConfigCreateOauthParams,
				bodyConfigCreateLti11Params,
				currentUser,
			};
		}

		it('should throw NotImplementedException when creating a basic external tool', () => {
			const { body, bodyConfigCreateBasicParams, currentUser } = setup();
			body.config = bodyConfigCreateBasicParams;

			const expected = () => controller.createExternalTool(body, currentUser);

			expect(expected).toThrow(NotImplementedException);
		});

		it('should throw NotImplementedException when creating an oauth2 external tool', () => {
			const { body, bodyConfigCreateOauthParams, currentUser } = setup();
			body.config = bodyConfigCreateOauthParams;

			const expected = () => controller.createExternalTool(body, currentUser);

			expect(expected).toThrow(NotImplementedException);
		});

		it('should throw NotImplementedException when creating a lti11 external tool', () => {
			const { body, bodyConfigCreateLti11Params, currentUser } = setup();
			body.config = bodyConfigCreateLti11Params;

			const expected = () => controller.createExternalTool(body, currentUser);

			expect(expected).toThrow(NotImplementedException);
		});
	});
});
