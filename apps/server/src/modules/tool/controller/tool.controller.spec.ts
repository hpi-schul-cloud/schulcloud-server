import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authorization } from 'oauth-1.0a';
import { ExternalToolUc } from '../uc/external-tool.uc';
import { Lti11Uc } from '../uc/lti11.uc';
import { Lti11LaunchResponse } from './dto';
import { ExternalToolRequestMapper, ExternalToolResponseMapper, Lti11ResponseMapper } from './mapper';
import { ToolController } from './tool.controller';

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
				{
					provide: ExternalToolUc,
					useValue: createMock<ExternalToolUc>(),
				},
				{
					provide: ExternalToolRequestMapper,
					useValue: createMock<ExternalToolRequestMapper>(),
				},
				{
					provide: ExternalToolResponseMapper,
					useValue: createMock<ExternalToolResponseMapper>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
			const currentUser: ICurrentUser = { userId: 'userId', roles: [RoleName.USER] } as ICurrentUser;
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
			expect(lti11Uc.getLaunchParameters).toHaveBeenCalledWith(
				currentUser.userId,
				currentUser.roles[0],
				toolId,
				courseId
			);
		});
	});
});
