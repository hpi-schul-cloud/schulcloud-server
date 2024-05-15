import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderService } from '@infra/oauth-provider';
import { ProviderOauthClient } from '@infra/oauth-provider/dto';
import { ICurrentUser } from '@modules/authentication';
import { AuthorizationService } from '@modules/authorization';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { setupEntities, userFactory } from '@shared/testing/factory';
import { OauthProviderClientCrudUc } from './oauth-provider.client-crud.uc';
import resetAllMocks = jest.resetAllMocks;

describe('OauthProviderUc', () => {
	let module: TestingModule;
	let uc: OauthProviderClientCrudUc;

	let providerService: DeepMocked<OauthProviderService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	let user: User;

	const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
	const defaultOauthClientBody: ProviderOauthClient = {
		scope: 'openid offline',
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code', 'token', 'id_token'],
		redirect_uris: [],
	};

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				OauthProviderClientCrudUc,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderClientCrudUc);
		providerService = module.get(OauthProviderService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		user = userFactory.buildWithId();
		authorizationService.getUserWithPermissions.mockResolvedValue(user);
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('Client Flow', () => {
		describe('listOAuth2Clients', () => {
			const data: ProviderOauthClient[] = [{ client_id: 'clientId' }];

			it('should list oauth2 clients in return value', async () => {
				providerService.listOAuth2Clients.mockResolvedValue(data);

				const result: ProviderOauthClient[] = await uc.listOAuth2Clients(currentUser);

				expect(result).toEqual(data);
			});

			it('should call the authorization service to check permissions', async () => {
				providerService.listOAuth2Clients.mockResolvedValue(data);

				await uc.listOAuth2Clients(currentUser, 1, 0, 'clientId', 'owner');

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_VIEW]);
			});

			it('should list oauth2 clients when service is called with all parameters', async () => {
				providerService.listOAuth2Clients.mockResolvedValue(data);

				await uc.listOAuth2Clients(currentUser, 1, 0, 'clientId', 'owner');

				expect(providerService.listOAuth2Clients).toHaveBeenCalledWith(1, 0, 'clientId', 'owner');
			});

			it('should list oauth2 clients when service is called without parameters', async () => {
				providerService.listOAuth2Clients.mockResolvedValue(data);

				await uc.listOAuth2Clients(currentUser);

				expect(providerService.listOAuth2Clients).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
			});

			it('should throw if user is not authorized', async () => {
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				await expect(uc.listOAuth2Clients(currentUser)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('getOAuth2Client', () => {
			it('should get oauth2 client', async () => {
				const data: ProviderOauthClient = { client_id: 'clientId' };

				providerService.getOAuth2Client.mockResolvedValue(data);

				const result: ProviderOauthClient = await uc.getOAuth2Client(currentUser, 'clientId');

				expect(result).toEqual(data);
				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_VIEW]);
				expect(providerService.getOAuth2Client).toHaveBeenCalledWith('clientId');
			});

			it('should throw if user is not authorized', async () => {
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				await expect(uc.getOAuth2Client(currentUser, 'clientId')).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('createOAuth2Client', () => {
			it('should create oauth2 client with defaults', async () => {
				const data: ProviderOauthClient = { client_id: 'clientId' };
				const dataWithDefaults: ProviderOauthClient = { ...defaultOauthClientBody, ...data };

				providerService.createOAuth2Client.mockResolvedValue(dataWithDefaults);

				const result: ProviderOauthClient = await uc.createOAuth2Client(currentUser, data);

				expect(result).toEqual(dataWithDefaults);
				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
				expect(providerService.createOAuth2Client).toHaveBeenCalledWith(dataWithDefaults);
			});

			it('should create oauth2 client without defaults', async () => {
				const data: ProviderOauthClient = {
					client_id: 'clientId',
					scope: 'openid',
					grant_types: ['authorization_code'],
					response_types: ['code'],
					redirect_uris: ['url'],
				};

				providerService.createOAuth2Client.mockResolvedValue(data);

				const result: ProviderOauthClient = await uc.createOAuth2Client(currentUser, data);

				expect(result).toEqual(data);
				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
				expect(providerService.createOAuth2Client).toHaveBeenCalledWith(data);
			});

			it('should throw if user is not authorized', async () => {
				const data: ProviderOauthClient = { client_id: 'clientId' };

				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				await expect(uc.createOAuth2Client(currentUser, data)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should update oauth2 client with defaults', async () => {
				const data: ProviderOauthClient = { client_id: 'clientId' };
				const dataWithDefaults = { ...defaultOauthClientBody, ...data };

				providerService.updateOAuth2Client.mockResolvedValue(dataWithDefaults);

				const result: ProviderOauthClient = await uc.updateOAuth2Client(currentUser, 'clientId', data);

				expect(result).toEqual(dataWithDefaults);
				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
				expect(providerService.updateOAuth2Client).toHaveBeenCalledWith('clientId', dataWithDefaults);
			});

			it('should update oauth2 client without defaults', async () => {
				const data: ProviderOauthClient = {
					client_id: 'clientId',
					scope: 'openid',
					grant_types: ['authorization_code'],
					response_types: ['code'],
					redirect_uris: ['url'],
				};

				providerService.updateOAuth2Client.mockResolvedValue(data);

				const result: ProviderOauthClient = await uc.updateOAuth2Client(currentUser, 'clientId', data);

				expect(result).toEqual(data);
				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
				expect(providerService.updateOAuth2Client).toHaveBeenCalledWith('clientId', data);
			});

			it('should throw if user is not authorized', async () => {
				const data: ProviderOauthClient = { client_id: 'clientId' };

				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				await expect(uc.updateOAuth2Client(currentUser, 'clientId', data)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should delete oauth2 client', async () => {
				await uc.deleteOAuth2Client(currentUser, 'clientId');

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
				expect(providerService.deleteOAuth2Client).toHaveBeenCalledWith('clientId');
			});

			it('should throw if user is not authorized', async () => {
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				await expect(uc.deleteOAuth2Client(currentUser, 'clientId')).rejects.toThrow(UnauthorizedException);
			});
		});
	});
});
