import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { LoginResponse } from '@src/modules/oauth-provider/controller/dto/response/login.response';
import { OauthProviderController } from './oauth-provider.controller';
import { ProviderLoginResponse, ProviderRedirectResponse } from '../../../shared/infra/oauth-provider/dto';
import { ICurrentUser } from '../../../shared/domain';
import { AcceptQuery, ChallengeParams, LoginRequestBody } from './dto';
import { OauthProviderLoginFlowUc } from '../uc/oauth-provider.login-flow.uc';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;
	let oauthProviderLoginFlowUc: DeepMocked<OauthProviderLoginFlowUc>;
	let oauthProviderResponseMapper: DeepMocked<OauthProviderResponseMapper>;

	const hydraUri = 'http://hydra.uri';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderLoginFlowUc,
					useValue: createMock<OauthProviderLoginFlowUc>(),
				},
				{
					provide: OauthProviderResponseMapper,
					useValue: createMock<OauthProviderResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);
		oauthProviderLoginFlowUc = module.get(OauthProviderLoginFlowUc);
		oauthProviderResponseMapper = module.get(OauthProviderResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});
	const params: ChallengeParams = { challenge: 'challenge' };
	const loginResponse: LoginResponse = {
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

	describe('Login flow', () => {
		describe('getLoginRequest', () => {
			it('should get the login request response', async () => {
				const oauthLoginResponse: ProviderLoginResponse = {
					challenge: 'challenge',
					client: {},
					oidc_context: {},
					request_url: 'request_url',
					requested_access_token_audience: ['requested_access_token_audience'],
					requested_scope: ['requested_scope'],
					session_id: 'session_id',
					skip: true,
					subject: 'subject',
				} as ProviderLoginResponse;

				oauthProviderLoginFlowUc.getLoginRequest.mockResolvedValue(oauthLoginResponse);
				oauthProviderResponseMapper.mapLoginResponse.mockReturnValue(loginResponse);

				const response = await controller.getLoginRequest(params);

				expect(oauthProviderLoginFlowUc.getLoginRequest).toHaveBeenCalledWith(params.challenge);
				expect(response.subject).toEqual(oauthLoginResponse.subject);
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
				const providerRedirectResponse: ProviderRedirectResponse = {
					redirect_to: 'redirect_to',
				};
				const redirectResponse: ProviderRedirectResponse = {
					redirect_to: 'redirect_to',
				};
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const expected = [currentUser.userId, params.challenge, loginRequestBody, query];

				oauthProviderLoginFlowUc.patchLoginRequest.mockResolvedValue(providerRedirectResponse);
				oauthProviderResponseMapper.mapRedirectResponse.mockReturnValue(redirectResponse);

				const response = await controller.patchLoginRequest(params, query, loginRequestBody, currentUser);
				expect(oauthProviderLoginFlowUc.patchLoginRequest).toHaveBeenCalledWith(
					currentUser.userId,
					params.challenge,
					loginRequestBody,
					query
				);
				expect(oauthProviderLoginFlowUc.patchLoginRequest).toHaveBeenCalledWith(...expected);
				expect(response.redirect_to).toStrictEqual(redirectResponse.redirect_to);
			});
		});
	});

	describe('getUrl', () => {
		it('should return hydra uri', async () => {
			const result: string = await controller.getUrl();

			expect(result).toEqual(hydraUri);
		});
	});
});
