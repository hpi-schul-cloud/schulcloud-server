import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiToolRepo, PseudonymsRepo, RoleRepo, UserRepo } from '@shared/repo';
import { ICurrentUser, Permission, PermissionService, PseudonymDO, User } from '@shared/domain';
import { LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { OauthProviderLoginFlowService } from '@src/modules/oauth-provider/service/oauth-provider.login-flow.service';
import { LoginResponse } from '@shared/infra/oauth-provider/dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { roleFactory, userFactory, setupEntities } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ObjectID } from 'bson';
import clearAllMocks = jest.clearAllMocks;

describe('OauthProviderLoginFlowService', () => {
	let module: TestingModule;
	let service: DeepMocked<OauthProviderLoginFlowService>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let pseudonymsRepo: DeepMocked<PseudonymsRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let roleRepo: DeepMocked<RoleRepo>;
	let permissionService: DeepMocked<PermissionService>;
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
					provide: PermissionService,
					useValue: createMock<PermissionService>(),
				},
			],
		}).compile();

		service = module.get(OauthProviderLoginFlowService);
		userRepo = module.get(UserRepo);
		ltiToolRepo = module.get(LtiToolRepo);
		pseudonymsRepo = module.get(PseudonymsRepo);
		roleRepo = module.get(RoleRepo);
		permissionService = module.get(PermissionService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
		clearAllMocks();
	});

	describe('setSubject', () => {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
		const loginRequestBodyMock: LoginRequestBody = {
			remember: true,
			remember_for: 0,
		};

		it('set the subject in acceptLoginRequestBody succesfully', async () => {
			const loginResponse: LoginResponse = {
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
			} as LoginResponse;
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

			ltiToolRepo.findByOauthClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);
			pseudonymsRepo.findByUserIdAndToolId.mockResolvedValue(pseudonym);

			const acceptLoginRequestBody = await service.setSubject(currentUser.userId, loginResponse, loginRequestBodyMock);

			expect(ltiToolRepo.findByOauthClientIdAndIsLocal).toHaveBeenCalledWith(loginResponse.client.client_id);
			expect(pseudonymsRepo.findByUserIdAndToolId).toHaveBeenCalledWith(ltiToolDoMock.id, currentUser.userId);
			expect(acceptLoginRequestBody.subject).toStrictEqual('userId');
			expect(acceptLoginRequestBody.amr).toBeUndefined();
			expect(acceptLoginRequestBody.acr).toBeUndefined();
			expect(acceptLoginRequestBody.remember).toBeTruthy();
			expect(acceptLoginRequestBody.remember_for).toStrictEqual(0);
			expect(acceptLoginRequestBody.force_subject_identifier).toStrictEqual(
				acceptLoginRequestBody.force_subject_identifier
			);
		});
		it('could not set the subject in acceptLoginRequestBody and throw error', async () => {
			const loginResponse: LoginResponse = {
				challenge: 'challenge',
				client: {},
				oidc_context: {},
				skip: true,
				subject: 'subject',
			} as LoginResponse;
			await expect(service.setSubject(currentUser.userId, loginResponse, loginRequestBodyMock)).rejects.toThrow(
				NotFoundException
			);
		});
	});
	describe('validateNextcloudPermission', () => {
		it('should validate Nextcloud permissions', async () => {
			const currentUser: ICurrentUser = { userId: new ObjectID(213135).toString() } as ICurrentUser;
			const role = roleFactory.build({ permissions: ['NEXTCLOUD_USER' as Permission] });

			const user: User = userFactory.buildWithId({ roles: [role] }, currentUser.userId);
			const loginResponse: LoginResponse = {
				challenge: 'challenge',
				client: {
					client_id: 'clientId',
				},
				oidc_context: {},
			} as LoginResponse;
			const ltiToolDoMock: LtiToolDO = {
				id: 'toolId',
				name: 'name',
				oAuthClientId: 'oAuthClientId',
				isLocal: true,
			};

			userRepo.findById.mockResolvedValue(user);
			permissionService.resolvePermissions.mockReturnValue(role.permissions);
			ltiToolRepo.findByOauthClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);

			const validation = await service.validateNextcloudPermission(currentUser.userId, loginResponse);

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(permissionService.resolvePermissions).toHaveBeenCalledWith(user);
			expect(ltiToolRepo.findByOauthClientIdAndIsLocal).toHaveBeenCalledWith(loginResponse.client.client_id);
		});

		it('should trow a ForbiddenException', async () => {
			const currentUser: ICurrentUser = { userId: new ObjectID(213135).toString() } as ICurrentUser;
			const role = roleFactory.build();
			const user: User = userFactory.buildWithId({ roles: [role] }, currentUser.userId);
			const loginResponse: LoginResponse = {
				challenge: 'challenge',
				client: {
					client_id: 'clientId',
				},
			} as LoginResponse;
			const ltiToolDoMock: LtiToolDO = {
				id: 'toolId',
				name: 'SchulcloudNextcloud',
				oAuthClientId: 'oAuthClientId',
				isLocal: true,
			};

			userRepo.findById.mockResolvedValue(user);
			permissionService.resolvePermissions.mockReturnValue(role.permissions);
			ltiToolRepo.findByOauthClientIdAndIsLocal.mockResolvedValue(ltiToolDoMock);

			await expect(service.validateNextcloudPermission(currentUser.userId, loginResponse)).rejects.toThrow(
				ForbiddenException
			);
		});
	});
});
