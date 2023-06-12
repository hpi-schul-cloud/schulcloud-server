import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LtiPrivacyPermission, LtiRoleType, Permission, PseudonymDO, User } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ProviderLoginResponse } from '@shared/infra/oauth-provider/dto';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules';
import { ICurrentUser } from '@src/modules/authentication';
import { ObjectID } from 'bson';
import { OauthProviderLoginFlowService } from './oauth-provider-login-flow.service';

describe('OauthProviderLoginFlowService', () => {
	let module: TestingModule;
	let service: OauthProviderLoginFlowService;

	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let pseudonymsRepo: DeepMocked<PseudonymsRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;

	let ltiToolDoMock: LtiToolDO;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderLoginFlowService,
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

		service = module.get(OauthProviderLoginFlowService);
		ltiToolRepo = module.get(LtiToolRepo);
		pseudonymsRepo = module.get(PseudonymsRepo);
		authorizationService = module.get(AuthorizationService);
		await setupEntities();
	});

	beforeEach(() => {
		ltiToolDoMock = new LtiToolDO({
			id: 'toolId',
			name: 'SchulcloudNextcloud',
			isLocal: true,
			oAuthClientId: 'oAuthClientId',
			secret: 'mocksecret',
			customs: [{ key: 'key', value: 'value' }],
			isHidden: false,
			isTemplate: false,
			key: 'key',
			openNewTab: false,
			originToolId: 'originToolId',
			privacy_permission: LtiPrivacyPermission.NAME,
			roles: [LtiRoleType.INSTRUCTOR, LtiRoleType.LEARNER],
			url: 'url',
			friendlyUrl: 'friendlyUrl',
			frontchannel_logout_uri: 'frontchannel_logout_uri',
			logo_url: 'logo_url',
			lti_message_type: 'lti_message_type',
			lti_version: 'lti_version',
			resource_link_id: 'resource_link_id',
			skipConsent: true,
		});
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getPseudonym', () => {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

		it('should get the Pseudonym successfully', async () => {
			const loginResponse: ProviderLoginResponse = {
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
			};
			ltiToolDoMock = { ...ltiToolDoMock, id: 'toolId', name: 'name', oAuthClientId: 'oAuthClientId' };
			const pseudonym: PseudonymDO = {
				pseudonym: 'pseudonym',
				toolId: 'toolId',
				userId: 'userId',
			};

			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);
			pseudonymsRepo.findByUserIdAndToolIdOrFail.mockResolvedValue(pseudonym);

			const pseudonymDO: PseudonymDO = await service.getPseudonym(currentUser.userId, loginResponse);

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(loginResponse.client.client_id, true);
			expect(pseudonymsRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(currentUser.userId, ltiToolDoMock.id);
			expect(pseudonymDO).toEqual(pseudonym);
		});

		it('should throw NotFoundException, if Pseudonym could not be found', async () => {
			const loginResponse: ProviderLoginResponse = {
				challenge: 'challenge',
				client: {},
				oidc_context: {},
				skip: true,
				subject: 'subject',
			} as ProviderLoginResponse;

			await expect(service.getPseudonym(currentUser.userId, loginResponse)).rejects.toThrow(
				InternalServerErrorException
			);
		});
	});

	describe('validateNextcloudPermission', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should call the services and repos to validate Nextcloud permissions', async () => {
			const currentUser: ICurrentUser = { userId: new ObjectID(213135).toString() } as ICurrentUser;
			const role = roleFactory.build({ permissions: ['NEXTCLOUD_USER' as Permission] });
			const user: User = userFactory.buildWithId({ roles: [role] }, currentUser.userId);
			const loginResponse: ProviderLoginResponse = {
				challenge: 'challenge',
				client: {
					client_id: 'clientId',
				},
				oidc_context: {},
			} as ProviderLoginResponse;

			authorizationService.getUserWithPermissions.mockResolvedValue(user);
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);

			await service.validateNextcloudPermission(currentUser.userId, loginResponse);

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(loginResponse.client.client_id, true);
			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.NEXTCLOUD_USER]);
		});

		it('should throw a InternalServerErrorException, if the oauth2 provider does not return a client_id', async () => {
			const loginResponse: ProviderLoginResponse = {
				challenge: 'challenge',
				oidc_context: {},
			} as ProviderLoginResponse;

			await expect(service.validateNextcloudPermission('userId', loginResponse)).rejects.toThrow(
				InternalServerErrorException
			);
		});

		it('should throw a UnauthorizedException, if the user do not have nextcloud permission', async () => {
			const currentUser: ICurrentUser = { userId: new ObjectID(213135).toString() } as ICurrentUser;
			const role = roleFactory.build();
			const user: User = userFactory.buildWithId({ roles: [role] }, currentUser.userId);
			const loginResponse: ProviderLoginResponse = {
				challenge: 'challenge',
				client: {
					client_id: 'clientId',
				},
			} as ProviderLoginResponse;

			authorizationService.getUserWithPermissions.mockResolvedValue(user);
			authorizationService.checkAllPermissions.mockImplementation(() => {
				throw new UnauthorizedException();
			});
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);

			await expect(service.validateNextcloudPermission(currentUser.userId, loginResponse)).rejects.toThrow(
				UnauthorizedException
			);
		});

		it('should do nothing when it is not a nextcloud tool', async () => {
			const loginResponse: ProviderLoginResponse = {
				challenge: 'challenge',
				client: {
					client_id: 'clientId',
				},
			} as ProviderLoginResponse;
			ltiToolDoMock = { ...ltiToolDoMock, id: 'toolId', name: 'NotNextcloud', oAuthClientId: 'oAuthClientId' };

			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);

			await service.validateNextcloudPermission('userId', loginResponse);

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith('clientId', true);
			expect(authorizationService.getUserWithPermissions).not.toHaveBeenCalled();
			expect(authorizationService.checkAllPermissions).not.toHaveBeenCalled();
		});
	});
});
