import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { PseudonymService } from '@modules/pseudonym';
import { pseudonymFactory } from '@modules/pseudonym/testing';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { OauthProviderLoginFlowService, OauthProviderService, ProviderRedirectResponse } from '../domain';
import { providerLoginResponseFactory } from '../testing';
import { OauthProviderLoginFlowUc } from './oauth-provider.login-flow.uc';

describe(OauthProviderLoginFlowUc.name, () => {
	let module: TestingModule;
	let uc: OauthProviderLoginFlowUc;

	let oauthProviderService: DeepMocked<OauthProviderService>;
	let oauthProviderLoginFlowService: DeepMocked<OauthProviderLoginFlowService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let userService: DeepMocked<UserService>;

	const pseudonym = pseudonymFactory.build({
		pseudonym: 'pseudonym',
		toolId: 'toolId',
		userId: 'userId',
	});
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
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderLoginFlowUc);
		oauthProviderService = module.get(OauthProviderService);
		oauthProviderLoginFlowService = module.get(OauthProviderLoginFlowService);
		pseudonymService = module.get(PseudonymService);
		authorizationService = module.get(AuthorizationService);
		userService = module.get(UserService);

		await setupEntities([User]);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLoginRequest', () => {
		describe('when fetching a login request', () => {
			const setup = () => {
				const providerLoginResponse = providerLoginResponseFactory.build({
					challenge: 'challenge',
					client: {
						client_id: 'clientId',
					},
					oidc_context: {},
					request_url: 'request_url',
					requested_access_token_audience: ['requested_access_token_audience'],
					requested_scope: ['requested_scope'],
					session_id: 'session_id',
					skip: true,
					subject: 'subject',
				});

				oauthProviderService.getLoginRequest.mockResolvedValue(providerLoginResponse);

				return {
					providerLoginResponse,
				};
			};

			it('should get the login request', async () => {
				const { providerLoginResponse } = setup();

				const result = await uc.getLoginRequest('challenge');

				expect(oauthProviderService.getLoginRequest).toHaveBeenCalledWith('challenge');
				expect(result).toEqual(providerLoginResponse);
			});
		});
	});

	describe('patchLoginRequest', () => {
		describe('when the login was accepted for an external tool', () => {
			const setup = () => {
				const query = { accept: true };

				const loginRequestBodyMock = {
					remember: true,
					remember_for: 0,
				};

				const providerLoginResponse = providerLoginResponseFactory.build({
					challenge: 'challenge',
					client: {
						client_id: 'clientId',
					},
					oidc_context: {},
					request_url: 'request_url',
					requested_access_token_audience: ['requested_access_token_audience'],
					requested_scope: ['requested_scope'],
					session_id: 'session_id',
					skip: true,
					subject: 'subject',
				});

				const user = userDoFactory.buildWithId();
				const tool = externalToolFactory.withOauth2Config({ skipConsent: true }).buildWithId();

				oauthProviderService.getLoginRequest.mockResolvedValue(providerLoginResponse);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				oauthProviderLoginFlowService.isNextcloudTool.mockReturnValue(false);
				userService.findById.mockResolvedValue(user);
				pseudonymService.findOrCreatePseudonym.mockResolvedValue(pseudonym);
				oauthProviderService.acceptLoginRequest.mockResolvedValue(redirectResponse);

				return {
					query,
					loginRequestBodyMock,
					tool,
					user,
					userId: user.id as string,
				};
			};

			it('should call userService', async () => {
				const { query, loginRequestBodyMock, userId } = setup();

				await uc.patchLoginRequest(userId, 'challenge', loginRequestBodyMock, query);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});

			it('should call pseudonymService', async () => {
				const { query, loginRequestBodyMock, tool, user } = setup();

				await uc.patchLoginRequest('userId', 'challenge', loginRequestBodyMock, query);

				expect(pseudonymService.findOrCreatePseudonym).toHaveBeenCalledWith(user, tool);
			});

			it('should accept the login request', async () => {
				const { query, loginRequestBodyMock } = setup();

				await uc.patchLoginRequest('userId', 'challenge', loginRequestBodyMock, query);

				expect(oauthProviderService.acceptLoginRequest).toHaveBeenCalledWith('challenge', {
					...loginRequestBodyMock,
					subject: 'userId',
					force_subject_identifier: pseudonym.pseudonym,
					context: {
						skipConsent: true,
					},
				});
			});

			it('should return a redirect', async () => {
				const { query, loginRequestBodyMock } = setup();

				const result = await uc.patchLoginRequest('userId', 'challenge', loginRequestBodyMock, query);

				expect(result).toEqual(redirectResponse);
			});
		});

		describe('when the tool is Nextcloud', () => {
			const setup = () => {
				const query = { accept: true };

				const loginRequestBodyMock = {
					remember: true,
					remember_for: 0,
				};

				const providerLoginResponse = providerLoginResponseFactory.build({
					challenge: 'challenge',
					client: {
						client_id: 'clientId',
					},
					oidc_context: {},
					request_url: 'request_url',
					requested_access_token_audience: ['requested_access_token_audience'],
					requested_scope: ['requested_scope'],
					session_id: 'session_id',
					skip: true,
					subject: 'subject',
				});

				const tool = externalToolFactory.withOauth2Config().buildWithId({ name: 'SchulcloudNextcloud' });

				const user = userFactory.buildWithId();

				oauthProviderService.getLoginRequest.mockResolvedValue(providerLoginResponse);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				oauthProviderLoginFlowService.isNextcloudTool.mockReturnValue(true);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				pseudonymService.findOrCreatePseudonym.mockResolvedValue(pseudonym);
				oauthProviderService.acceptLoginRequest.mockResolvedValue(redirectResponse);

				return {
					query,
					loginRequestBodyMock,
					user,
				};
			};

			it('should check for NEXTCLOUD_USER permission', async () => {
				const { query, loginRequestBodyMock, user } = setup();

				await uc.patchLoginRequest('userId', 'challenge', loginRequestBodyMock, query);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.NEXTCLOUD_USER]);
			});
		});

		describe('when the loaded tool has no id', () => {
			const setup = () => {
				const query = { accept: true };

				const loginRequestBodyMock = {
					remember: true,
					remember_for: 0,
				};

				const providerLoginResponse = providerLoginResponseFactory.build({
					challenge: 'challenge',
					client: {
						client_id: 'clientId',
					},
					oidc_context: {},
					request_url: 'request_url',
					requested_access_token_audience: ['requested_access_token_audience'],
					requested_scope: ['requested_scope'],
					session_id: 'session_id',
					skip: true,
					subject: 'subject',
				});

				const tool = externalToolFactory.withOauth2Config().build({ id: undefined });

				oauthProviderService.getLoginRequest.mockResolvedValue(providerLoginResponse);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);

				return {
					query,
					loginRequestBodyMock,
				};
			};

			it('should throw an InternalServerErrorException', async () => {
				const { query, loginRequestBodyMock } = setup();

				const func = async () => uc.patchLoginRequest('userId', 'challenge', loginRequestBodyMock, query);

				await expect(func).rejects.toThrow(new InternalServerErrorException('Tool has no id'));
			});
		});

		describe('when the required tool does not has a oauth2 config', () => {
			const setup = () => {
				const query = { accept: true };

				const loginRequestBodyMock = {
					remember: true,
					remember_for: 0,
				};

				const providerLoginResponse = providerLoginResponseFactory.build({
					challenge: 'challenge',
					client: {
						client_id: 'clientId',
					},
					oidc_context: {},
					request_url: 'request_url',
					requested_access_token_audience: ['requested_access_token_audience'],
					requested_scope: ['requested_scope'],
					session_id: 'session_id',
					skip: true,
					subject: 'subject',
				});

				const tool = externalToolFactory.buildWithId();

				oauthProviderService.getLoginRequest.mockResolvedValue(providerLoginResponse);
				oauthProviderLoginFlowService.findToolByClientId.mockResolvedValue(tool);
				oauthProviderLoginFlowService.isNextcloudTool.mockReturnValue(false);
				pseudonymService.findOrCreatePseudonym.mockResolvedValue(pseudonym);

				return {
					query,
					loginRequestBodyMock,
					tool,
				};
			};

			it('should throw an UnprocessableEntityException', async () => {
				const { query, loginRequestBodyMock, tool } = setup();

				const func = async () => uc.patchLoginRequest('userId', 'challenge', loginRequestBodyMock, query);

				await expect(func).rejects.toThrow(
					new UnprocessableEntityException(
						`Cannot use Tool ${tool.name} for OAuth2 login, since it is not a OAuth2-ExternalTool`
					)
				);
			});
		});

		describe('when the login was rejected', () => {
			const setup = () => {
				const query = { accept: false };
				const rejectBody = {
					error: 'error',
					error_debug: 'error_debug',
					error_description: 'error_description',
					error_hint: 'error_hint',
					status_code: 404,
				};

				oauthProviderService.rejectLoginRequest.mockResolvedValue(redirectResponse);

				return {
					query,
					rejectBody,
				};
			};

			it('should call the service to reject the login request', async () => {
				const { query, rejectBody } = setup();

				await uc.patchLoginRequest('userId', 'challenge', rejectBody, query);

				expect(oauthProviderService.rejectLoginRequest).toHaveBeenCalledWith('challenge', rejectBody);
			});

			it('should return a redirect response', async () => {
				const { query, rejectBody } = setup();

				const result = await uc.patchLoginRequest('userId', 'challenge', rejectBody, query);

				expect(result).toStrictEqual(redirectResponse);
			});
		});
	});
});
