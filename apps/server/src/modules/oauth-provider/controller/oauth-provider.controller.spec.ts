import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderController } from './oauth-provider.controller';
import { LoginResponse, RedirectResponse } from '../../../shared/infra/oauth-provider/dto';
import { ICurrentUser } from '../../../shared/domain';
import { AcceptQuery, ChallengeParams, LoginRequestBody } from './dto';
import { OauthProviderLoginFlowUc } from '../uc/oauth-provider.login-flow.uc';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;
	let oauthProviderLoginFlowUc: DeepMocked<OauthProviderLoginFlowUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderLoginFlowUc,
					useValue: createMock<OauthProviderLoginFlowUc>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);
		oauthProviderLoginFlowUc = module.get(OauthProviderLoginFlowUc);
	});

	afterAll(async () => {
		await module.close();
	});
	const params: ChallengeParams = { challenge: 'challenge' };

	describe('getLoginRequest', () => {
		it('should get the login request response', async () => {
			const loginResponseMock = {
				challenge: 'challenge',
				client: {},
				oidc_context: {},
				request_url: 'request_url',
				requested_access_token_audience: ['requested_access_token_audience'],
				requested_scope: ['requested_scope'],
				session_id: 'session_id',
				skip: true,
				subject: 'subject',
			} as LoginResponse;

			oauthProviderLoginFlowUc.getLoginRequest.mockResolvedValue(loginResponseMock);

			const response = await controller.getLoginRequest(params);

			expect(oauthProviderLoginFlowUc.getLoginRequest).toHaveBeenCalledWith(params.challenge);
			expect(response).toStrictEqual(loginResponseMock);
		});
	});
	describe('patchLoginRequest', () => {
		it('should patch the login request', async () => {
			const query: AcceptQuery = {
				accept: 1,
			};
			const loginRequestBody: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};
			const redirectResponse: RedirectResponse = {
				redirect_to: 'redirect_to',
			};
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const expected = [currentUser.userId, params.challenge, loginRequestBody, query];

			oauthProviderLoginFlowUc.patchLoginRequest.mockResolvedValue(redirectResponse);

			const response = await controller.patchLoginRequest(params, query, loginRequestBody, currentUser);
			expect(oauthProviderLoginFlowUc.patchLoginRequest).toHaveBeenCalledWith(
				currentUser.userId,
				params.challenge,
				loginRequestBody,
				query
			);
			expect(oauthProviderLoginFlowUc.patchLoginRequest).toHaveBeenCalledWith(...expected);
			expect(response).toStrictEqual(redirectResponse);
		});
	});
});
