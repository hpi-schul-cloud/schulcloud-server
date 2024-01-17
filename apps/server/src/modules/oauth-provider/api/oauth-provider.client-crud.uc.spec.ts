import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities, userFactory } from '@shared/testing';
import { ProviderOauthClient } from '../domain';
import { OauthProviderService } from '../domain/service/oauth-provider.service';
import { providerOauthClientFactory } from '../testing';
import { OauthProviderClientCrudUc } from './oauth-provider.client-crud.uc';

describe(OauthProviderClientCrudUc.name, () => {
	let module: TestingModule;
	let uc: OauthProviderClientCrudUc;

	let providerService: DeepMocked<OauthProviderService>;
	let authorizationService: DeepMocked<AuthorizationService>;

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

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('listOAuth2Clients', () => {
		describe('when listing all oauth2 clients', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClients: ProviderOauthClient[] = providerOauthClientFactory.buildList(1);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				providerService.listOAuth2Clients.mockResolvedValueOnce(providerOauthClients);

				return {
					user,
					providerOauthClients,
				};
			};

			it('should return list of oauth2 clients', async () => {
				const { user, providerOauthClients } = setup();

				const result: ProviderOauthClient[] = await uc.listOAuth2Clients(user.id, 1, 0, 'clientId', 'owner');

				expect(result).toEqual(providerOauthClients);
			});

			it('should check permissions', async () => {
				const { user } = setup();

				await uc.listOAuth2Clients(user.id, 1, 0, 'clientId', 'owner');

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_VIEW]);
			});

			it('should call the external provider', async () => {
				const { user } = setup();

				await uc.listOAuth2Clients(user.id, 1, 0, 'clientId', 'owner');

				expect(providerService.listOAuth2Clients).toHaveBeenCalledWith(1, 0, 'clientId', 'owner');
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const error = new UnauthorizedException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, error } = setup();

				await expect(uc.listOAuth2Clients(user.id)).rejects.toThrow(error);
			});
		});
	});

	describe('getOAuth2Client', () => {
		describe('when fetching a oauth2 client', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				providerService.getOAuth2Client.mockResolvedValueOnce(providerOauthClient);

				return {
					user,
					providerOauthClient,
				};
			};

			it('should return the oauth2 client', async () => {
				const { user, providerOauthClient } = setup();

				const result: ProviderOauthClient = await uc.getOAuth2Client(user.id, providerOauthClient.client_id);

				expect(result).toEqual(providerOauthClient);
			});

			it('should check permissions', async () => {
				const { user, providerOauthClient } = setup();

				await uc.getOAuth2Client(user.id, providerOauthClient.client_id);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_VIEW]);
			});

			it('should call the external provider', async () => {
				const { user, providerOauthClient } = setup();

				await uc.getOAuth2Client(user.id, providerOauthClient.client_id);

				expect(providerService.getOAuth2Client).toHaveBeenCalledWith(providerOauthClient.client_id);
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();
				const error = new UnauthorizedException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					providerOauthClient,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, providerOauthClient, error } = setup();

				await expect(uc.getOAuth2Client(user.id, providerOauthClient.client_id)).rejects.toThrow(error);
			});
		});
	});

	describe('createOAuth2Client', () => {
		describe('when creating a oauth2 client', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				providerService.createOAuth2Client.mockResolvedValueOnce(providerOauthClient);

				return {
					user,
					providerOauthClient,
				};
			};

			it('should return the oauth2 client', async () => {
				const { user, providerOauthClient } = setup();

				const result: ProviderOauthClient = await uc.createOAuth2Client(user.id, providerOauthClient);

				expect(result).toEqual(providerOauthClient);
			});

			it('should check permissions', async () => {
				const { user, providerOauthClient } = setup();

				await uc.createOAuth2Client(user.id, providerOauthClient);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
			});

			it('should call the external provider', async () => {
				const { user, providerOauthClient } = setup();

				await uc.createOAuth2Client(user.id, providerOauthClient);

				expect(providerService.createOAuth2Client).toHaveBeenCalledWith(providerOauthClient);
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();
				const error = new UnauthorizedException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					providerOauthClient,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, providerOauthClient, error } = setup();

				await expect(uc.createOAuth2Client(user.id, providerOauthClient)).rejects.toThrow(error);
			});
		});
	});

	describe('updateOAuth2Client', () => {
		describe('when updating a oauth2 client', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				providerService.updateOAuth2Client.mockResolvedValueOnce(providerOauthClient);

				return {
					user,
					providerOauthClient,
				};
			};

			it('should return the oauth2 client', async () => {
				const { user, providerOauthClient } = setup();

				const result: ProviderOauthClient = await uc.updateOAuth2Client(
					user.id,
					providerOauthClient.client_id,
					providerOauthClient
				);

				expect(result).toEqual(providerOauthClient);
			});

			it('should check permissions', async () => {
				const { user, providerOauthClient } = setup();

				await uc.updateOAuth2Client(user.id, providerOauthClient.client_id, providerOauthClient);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
			});

			it('should call the external provider', async () => {
				const { user, providerOauthClient } = setup();

				await uc.updateOAuth2Client(user.id, providerOauthClient.client_id, providerOauthClient);

				expect(providerService.updateOAuth2Client).toHaveBeenCalledWith(
					providerOauthClient.client_id,
					providerOauthClient
				);
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();
				const error = new UnauthorizedException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					providerOauthClient,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, providerOauthClient, error } = setup();

				await expect(
					uc.updateOAuth2Client(user.id, providerOauthClient.client_id, providerOauthClient)
				).rejects.toThrow(error);
			});
		});
	});

	describe('deleteOAuth2Client', () => {
		describe('when updating a oauth2 client', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					providerOauthClient,
				};
			};

			it('should check permissions', async () => {
				const { user, providerOauthClient } = setup();

				await uc.deleteOAuth2Client(user.id, providerOauthClient.client_id);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.OAUTH_CLIENT_EDIT]);
			});

			it('should call the external provider', async () => {
				const { user, providerOauthClient } = setup();

				await uc.deleteOAuth2Client(user.id, providerOauthClient.client_id);

				expect(providerService.deleteOAuth2Client).toHaveBeenCalledWith(providerOauthClient.client_id);
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const providerOauthClient: ProviderOauthClient = providerOauthClientFactory.build();
				const error = new UnauthorizedException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					providerOauthClient,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, providerOauthClient, error } = setup();

				await expect(uc.deleteOAuth2Client(user.id, providerOauthClient.client_id)).rejects.toThrow(error);
			});
		});
	});
});
