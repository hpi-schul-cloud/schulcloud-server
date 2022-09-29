import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiToolRepo, PseudonymsRepo, RoleRepo, UserRepo } from '@shared/repo';
import { ICurrentUser, Permission, PseudonymDO, User } from '@shared/domain';
import { OauthProviderLoginFlowService } from '@src/modules/oauth-provider/service/oauth-provider.login-flow.service';
import { ProviderLoginResponse } from '@shared/infra/oauth-provider/dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ObjectID } from 'bson';
import { AuthorizationService } from '@src/modules';
import clearAllMocks = jest.clearAllMocks;

describe('OauthProviderLoginFlowService', () => {
	let module: TestingModule;
	let service: DeepMocked<OauthProviderLoginFlowService>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let pseudonymsRepo: DeepMocked<PseudonymsRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let orm: MikroORM;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderLoginFlowService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
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

		service = module.get(OauthProviderLoginFlowService);
		userRepo = module.get(UserRepo);
		ltiToolRepo = module.get(LtiToolRepo);
		pseudonymsRepo = module.get(PseudonymsRepo);
		authorizationService = module.get(AuthorizationService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
		clearAllMocks();
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
			} as ProviderLoginResponse;
			const ltiToolDoMock: LtiToolDO = {
				id: 'toolId',
				name: 'name',
				oAuthClientId: 'oAuthClientId',
				isLocal: true,
			};
			const pseudonym: PseudonymDO = {
				pseudonym: 'pseudonym',
				toolId: 'toolId',
				userId: 'userId',
			};

			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);
			pseudonymsRepo.findByUserIdAndToolId.mockResolvedValue(pseudonym);

			const pseudonymDO: PseudonymDO = await service.getPseudonym(currentUser.userId, loginResponse);

			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(loginResponse.client.client_id, true);
			expect(pseudonymsRepo.findByUserIdAndToolId).toHaveBeenCalledWith(ltiToolDoMock.id, currentUser.userId);
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

			await expect(service.getPseudonym(currentUser.userId, loginResponse)).rejects.toThrow(NotFoundException);
		});
	});

	describe('validateNextcloudPermission', () => {
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
			const ltiToolDoMock: LtiToolDO = {
				id: 'toolId',
				name: 'name',
				oAuthClientId: 'oAuthClientId',
				isLocal: true,
			};

			userRepo.findById.mockResolvedValue(user);
			authorizationService.hasAllPermissions.mockReturnValue(true);
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);

			await service.validateNextcloudPermission(currentUser.userId, loginResponse);

			expect(userRepo.findById).toHaveBeenCalledWith(user.id, true);
			expect(authorizationService.hasAllPermissions).toHaveBeenCalledWith(user, [Permission.NEXTCLOUD_USER as string]);
			expect(ltiToolRepo.findByClientIdAndIsLocal).toHaveBeenCalledWith(loginResponse.client.client_id, true);
		});

		it('should throw a ForbiddenException, if the user do not have nextcloud permission ', async () => {
			const currentUser: ICurrentUser = { userId: new ObjectID(213135).toString() } as ICurrentUser;
			const role = roleFactory.build();
			const user: User = userFactory.buildWithId({ roles: [role] }, currentUser.userId);
			const loginResponse: ProviderLoginResponse = {
				challenge: 'challenge',
				client: {
					client_id: 'clientId',
				},
			} as ProviderLoginResponse;
			const ltiToolDoMock: LtiToolDO = {
				id: 'toolId',
				name: 'SchulcloudNextcloud',
				oAuthClientId: 'oAuthClientId',
				isLocal: true,
			};

			userRepo.findById.mockResolvedValue(user);
			authorizationService.hasAllPermissions.mockReturnValue(false);
			ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);

			await expect(service.validateNextcloudPermission(currentUser.userId, loginResponse)).rejects.toThrow(
				ForbiddenException
			);
		});
	});
});
