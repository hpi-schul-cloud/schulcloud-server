import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Authorization } from 'oauth-1.0a';
import { ICurrentUser } from '@shared/domain';
import { Lti11LaunchResponse } from '@src/modules/tool/controller/dto/lti11-launch.response';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { NotImplementedException } from '@nestjs/common';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { BasicToolConfigParams } from '@src/modules/tool/controller/dto/request/basic-tool-config.params';
import { Lti11ToolConfigParams } from '@src/modules/tool/controller/dto/request/lti11-tool-config.params';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { Oauth2ToolConfigParams } from '@src/modules/tool/controller/dto/request/oauth2-tool-config.params';
import { ToolController } from './tool.controller';
import { Lti11Uc } from '../uc/lti11.uc';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';

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
		bodyConfigCreateOauthParams.frontchannelLogoutUrl = 'mockUrl';
		bodyConfigCreateOauthParams.skipConsent = true;

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
		body.version = 3;

		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

		it('should throw NotImplementedException when creating a basic external tool', async () => {
			const basicExternalToolBody = body;
			basicExternalToolBody.config = bodyConfigCreateBasicParams;

			const expected = controller.createExternalTool(basicExternalToolBody, currentUser);

			await expect(expected).rejects.toThrow(NotImplementedException);
		});

		it('should throw NotImplementedException when creating an oauth2 external tool', async () => {
			const oauth2ExternalToolBody = body;
			oauth2ExternalToolBody.config = bodyConfigCreateOauthParams;
			const expected = controller.createExternalTool(oauth2ExternalToolBody, currentUser);

			await expect(expected).rejects.toThrow(NotImplementedException);
		});

		it('should throw NotImplementedException when creating a lti11 external tool', async () => {
			const lti11ExternalToolBody = body;
			lti11ExternalToolBody.config = bodyConfigCreateLti11Params;

			const expected = controller.createExternalTool(lti11ExternalToolBody, currentUser);

			await expect(expected).rejects.toThrow(NotImplementedException);
		});
	});
});
