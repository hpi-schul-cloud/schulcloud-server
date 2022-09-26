import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderLoginFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.login-flow.uc';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { LtiToolRepo, PseudonymsRepo, RoleRepo } from '@shared/repo';
import { ICurrentUser, PermissionService } from '@shared/domain';
import {
	AcceptLoginRequestBody,
	ProviderLoginResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { AcceptQuery, ChallengeParams, LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { OauthProviderLoginFlowService } from '@src/modules/oauth-provider/service/oauth-provider.login-flow.service';
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

	const params: ChallengeParams = { challenge: 'challenge' };
	const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
	const acceptLoginRequestBody: AcceptLoginRequestBody = {
		subject: 'userId',
		acr: 'acr',
		amr: ['amr'],
		context: {},
		force_subject_identifier: 'pseudonym',
		remember: true,
		remember_for: 0,
	};
	const query: AcceptQuery = {
		accept: true,
	};
	const redirectResponse: ProviderRedirectResponse = {
		redirect_to: 'redirect_to',
	};

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
					provide: PermissionService,
					useValue: createMock<PermissionService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderLoginFlowUcSpec);
		service = module.get(OauthProviderService);
		oauthProviderLoginFlowService = module.get(OauthProviderLoginFlowService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('getLoginRequest', () => {
		it('should get the login request', async () => {
			const loginResponseMock: ProviderLoginResponse = {
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

			service.getLoginRequest.mockResolvedValue(loginResponseMock);

			const response = await uc.getLoginRequest(params.challenge);

			expect(service.getLoginRequest).toHaveBeenCalledWith(params.challenge);
			expect(response).toStrictEqual(loginResponseMock);
		});
	});
	describe('patchLoginRequest', () => {
		it('should call the login request', async () => {
			const loginResponseMock: ProviderLoginResponse = {
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
			const loginRequestBodyMock: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};
			service.getLoginRequest.mockResolvedValue(loginResponseMock);
			oauthProviderLoginFlowService.setSubject.mockResolvedValue(acceptLoginRequestBody);
			oauthProviderLoginFlowService.validateNextcloudPermission.mockResolvedValue();
			service.acceptLoginRequest.mockResolvedValue(redirectResponse);

			const response = await uc.patchLoginRequest(currentUser.userId, params.challenge, loginRequestBodyMock, query);

			expect(response.redirect_to).toStrictEqual(redirectResponse.redirect_to);
			expect(oauthProviderLoginFlowService.setSubject).toHaveBeenCalledWith(
				currentUser.userId,
				loginResponseMock,
				loginRequestBodyMock
			);
			expect(oauthProviderLoginFlowService.validateNextcloudPermission).toHaveBeenCalledWith(
				currentUser.userId,
				loginResponseMock
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
			const loginResponse: ProviderLoginResponse = {
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
			const loginRequestBodyMock: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};

			oauthProviderLoginFlowService.setSubject.mockResolvedValue(acceptLoginRequestBody);
			oauthProviderLoginFlowService.validateNextcloudPermission.mockResolvedValue();
			service.acceptLoginRequest.mockResolvedValue(redirectResponse);

			const response = await uc.acceptLoginRequestSpec(currentUser.userId, loginResponse, loginRequestBodyMock);

			expect(oauthProviderLoginFlowService.setSubject).toHaveBeenCalledWith(
				currentUser.userId,
				loginResponse,
				loginRequestBodyMock
			);
			expect(service.acceptLoginRequest).toHaveBeenCalledWith(params.challenge, acceptLoginRequestBody);
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
			oauthProviderLoginFlowService.setSubject.mockResolvedValue(acceptLoginRequestBody);
			oauthProviderLoginFlowService.validateNextcloudPermission.mockResolvedValue();
			service.rejectLoginRequest.mockResolvedValue(redirectResponse);

			const response = await uc.rejectLoginRequestSpec(params.challenge, rejectBody);

			expect(service.rejectLoginRequest).toHaveBeenCalledWith(params.challenge, rejectBody);
			expect(response).toStrictEqual(redirectResponse);
		});
	});
});
