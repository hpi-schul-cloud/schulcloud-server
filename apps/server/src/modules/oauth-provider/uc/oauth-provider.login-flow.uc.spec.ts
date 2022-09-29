import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderLoginFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.login-flow.uc';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { LtiToolRepo, PseudonymsRepo, RoleRepo } from '@shared/repo';
import { ICurrentUser, PseudonymDO } from '@shared/domain';
import {
	AcceptLoginRequestBody,
	ProviderLoginResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { AuthorizationService } from '@src/modules';
import { AcceptQuery, ChallengeParams, LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { OauthProviderLoginFlowService } from '@src/modules/oauth-provider/service/oauth-provider.login-flow.service';
import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import resetAllMocks = jest.resetAllMocks;

class OauthProviderLoginFlowUcSpec extends OauthProviderLoginFlowUc {
	public acceptLoginRequestSpec(
		currentUserId: string,
		loginResponse: ProviderLoginResponse,
		loginRequestBody: LoginRequestBody
	) {
		return super.acceptLoginRequest(currentUserId, loginResponse, loginRequestBody);
	}

	public rejectLoginRequestSpec(
		challenge: string,
		rejectRequestBody: RejectRequestBody
	): Promise<ProviderRedirectResponse> {
		return super.rejectLoginRequest(challenge, rejectRequestBody);
	}
}

describe('OauthProviderLoginFlowUc', () => {
	let module: TestingModule;
	let uc: OauthProviderLoginFlowUcSpec;
	let service: DeepMocked<OauthProviderService>;
	let oauthProviderLoginFlowService: DeepMocked<OauthProviderLoginFlowService>;
	let pseudonymRepo: DeepMocked<PseudonymsRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;

	const params: ChallengeParams = { challenge: 'challenge' };
	const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
	const query: AcceptQuery = {
		accept: true,
	};
	const redirectResponse: ProviderRedirectResponse = {
		redirect_to: 'redirect_to',
	};

	const pseudonym: PseudonymDO = {
		pseudonym: 'pseudonym',
		toolId: 'toolId',
		userId: 'userId',
	};

	const providerLoginResponse: ProviderLoginResponse = {
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

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderLoginFlowUcSpec,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: OauthProviderLoginFlowService,
					useValue: createMock<OauthProviderLoginFlowService>(),
				},
				{
					provide: RoleRepo,
					useValue: createMock<RoleRepo>(),
				},
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: PseudonymsRepo,
					useValue: createMock<PseudonymsRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderLoginFlowUcSpec);
		service = module.get(OauthProviderService);
		oauthProviderLoginFlowService = module.get(OauthProviderLoginFlowService);
		pseudonymRepo = module.get(PseudonymsRepo);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('getLoginRequest', () => {
		it('should get the login request', async () => {
			service.getLoginRequest.mockResolvedValue(providerLoginResponse);

			const response = await uc.getLoginRequest(params.challenge);

			expect(service.getLoginRequest).toHaveBeenCalledWith(params.challenge);
			expect(response).toStrictEqual(providerLoginResponse);
		});
	});
	describe('patchLoginRequest', () => {
		it('should call the login request', async () => {
			const loginRequestBodyMock: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};

			service.getLoginRequest.mockResolvedValue(providerLoginResponse);
			service.acceptLoginRequest.mockResolvedValue(redirectResponse);

			const response = await uc.patchLoginRequest(currentUser.userId, params.challenge, loginRequestBodyMock, query);

			expect(response.redirect_to).toStrictEqual(redirectResponse.redirect_to);
			expect(oauthProviderLoginFlowService.getPseudonym).toHaveBeenCalledWith(
				currentUser.userId,
				providerLoginResponse
			);
			expect(oauthProviderLoginFlowService.validateNextcloudPermission).toHaveBeenCalledWith(
				currentUser.userId,
				providerLoginResponse
			);
			expect(service.rejectLoginRequest).not.toHaveBeenCalled();
		});

		it('should call the reject login request', async () => {
			const rejectBody: RejectRequestBody = {
				error: 'error',
				error_debug: 'error_debug',
				error_description: 'error_description',
				error_hint: 'error_hint',
				status_code: 404,
			};

			service.rejectLoginRequest.mockResolvedValue(redirectResponse);

			const response = await uc.patchLoginRequest(currentUser.userId, params.challenge, rejectBody, query);

			expect(response).toStrictEqual(redirectResponse);
			expect(service.acceptLoginRequest).not.toHaveBeenCalled();
		});
	});
	describe('acceptLoginRequest', () => {
		it('should accept the login request', async () => {
			const loginRequestBodyMock: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};

			oauthProviderLoginFlowService.getPseudonym.mockResolvedValue(pseudonym);
			oauthProviderLoginFlowService.validateNextcloudPermission.mockResolvedValue();
			const mappedAcceptLoginRequestBody: AcceptLoginRequestBody =
				OauthProviderRequestMapper.mapCreateAcceptLoginRequestBody(
					loginRequestBodyMock,
					currentUser.userId,
					pseudonym.pseudonym
				);
			service.acceptLoginRequest.mockResolvedValue(redirectResponse);

			const response = await uc.acceptLoginRequestSpec(currentUser.userId, providerLoginResponse, loginRequestBodyMock);

			expect(oauthProviderLoginFlowService.getPseudonym).toHaveBeenCalledWith(
				currentUser.userId,
				providerLoginResponse
			);
			expect(service.acceptLoginRequest).toHaveBeenCalledWith(params.challenge, mappedAcceptLoginRequestBody);
			expect(response.redirect_to).toStrictEqual(redirectResponse.redirect_to);
		});
	});
	describe('rejectLoginRequest', () => {
		it('should reject the login request', async () => {
			const rejectBody: RejectRequestBody = {
				error: 'error',
				error_debug: 'error_debug',
				error_description: 'error_description',
				error_hint: 'error_hint',
				status_code: 404,
			};

			service.rejectLoginRequest.mockResolvedValue(redirectResponse);

			const response = await uc.rejectLoginRequestSpec(params.challenge, rejectBody);

			expect(service.rejectLoginRequest).toHaveBeenCalledWith(params.challenge, rejectBody);
			expect(response).toStrictEqual(redirectResponse);
		});
	});
});
