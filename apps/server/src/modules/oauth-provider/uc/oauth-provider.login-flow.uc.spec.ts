import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderLoginFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.login-flow.uc';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { PseudonymDO } from '@shared/domain';
import {
	AcceptLoginRequestBody,
	ProviderLoginResponse,
	ProviderRedirectResponse,
} from '@shared/infra/oauth-provider/dto';
import { AcceptQuery, LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { OauthProviderLoginFlowService } from '@src/modules/oauth-provider/service/oauth-provider.login-flow.service';
import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import { RejectBody } from '@src/modules/oauth-provider/controller/dto/request/reject.body';

describe('OauthProviderLoginFlowUc', () => {
	let module: TestingModule;
	let uc: OauthProviderLoginFlowUc;

	let service: DeepMocked<OauthProviderService>;
	let oauthProviderLoginFlowService: DeepMocked<OauthProviderLoginFlowService>;
	let mapper: DeepMocked<OauthProviderRequestMapper>;

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
	};
	const redirectResponse: ProviderRedirectResponse = {
		redirect_to: 'redirect_to',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderLoginFlowUc,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: OauthProviderLoginFlowService,
					useValue: createMock<OauthProviderLoginFlowService>(),
				},
				{
					provide: OauthProviderRequestMapper,
					useValue: createMock<OauthProviderRequestMapper>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderLoginFlowUc);
		service = module.get(OauthProviderService);
		oauthProviderLoginFlowService = module.get(OauthProviderLoginFlowService);
		mapper = module.get(OauthProviderRequestMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLoginRequest', () => {
		it('should get the login request', async () => {
			service.getLoginRequest.mockResolvedValue(providerLoginResponse);

			const result: ProviderLoginResponse = await uc.getLoginRequest('challenge');

			expect(service.getLoginRequest).toHaveBeenCalledWith('challenge');
			expect(result).toEqual(providerLoginResponse);
		});
	});

	describe('patchLoginRequest', () => {
		it('should accept the login request, if accept query is true', async () => {
			const query: AcceptQuery = { accept: true };
			const loginRequestBodyMock: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};
			const mappedAcceptLoginRequestBody: AcceptLoginRequestBody = {
				remember: true,
				remember_for: 0,
				subject: 'currentUserId',
				force_subject_identifier: 'pseudonym',
			};

			service.getLoginRequest.mockResolvedValue(providerLoginResponse);
			oauthProviderLoginFlowService.getPseudonym.mockResolvedValue(pseudonym);
			mapper.mapCreateAcceptLoginRequestBody.mockReturnValue(mappedAcceptLoginRequestBody);
			oauthProviderLoginFlowService.validateNextcloudPermission.mockResolvedValue();
			service.acceptLoginRequest.mockResolvedValue(redirectResponse);

			const result: ProviderRedirectResponse = await uc.patchLoginRequest(
				'userId',
				'challenge',
				loginRequestBodyMock,
				query
			);

			expect(service.getLoginRequest).toHaveBeenCalledWith('challenge');
			expect(oauthProviderLoginFlowService.getPseudonym).toHaveBeenCalledWith('userId', providerLoginResponse);
			expect(oauthProviderLoginFlowService.validateNextcloudPermission).toHaveBeenCalledWith(
				'userId',
				providerLoginResponse
			);
			expect(service.acceptLoginRequest).toHaveBeenCalledWith('challenge', mappedAcceptLoginRequestBody);
			expect(result).toEqual(redirectResponse);
		});

		it('should reject the login request, if accept query is false', async () => {
			const query: AcceptQuery = { accept: false };
			const rejectBody: RejectBody = {
				error: 'error',
				error_debug: 'error_debug',
				error_description: 'error_description',
				error_hint: 'error_hint',
				status_code: 404,
			};

			service.rejectLoginRequest.mockResolvedValue(redirectResponse);

			const result: ProviderRedirectResponse = await uc.patchLoginRequest('userId', 'challenge', rejectBody, query);

			expect(service.rejectLoginRequest).toHaveBeenCalledWith('challenge', rejectBody);
			expect(result).toStrictEqual(redirectResponse);
		});
	});
});
