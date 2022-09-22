import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotImplementedException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { ICurrentUser } from '@shared/domain/index';
import { OauthProviderController } from './oauth-provider.controller';
import { OauthClientBody, OauthClientResponse } from './dto';
import { OauthProviderClientCrudUc } from '../uc/oauth-provider.client-crud.uc';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;

	let uc: DeepMocked<OauthProviderClientCrudUc>;
	let responseMapper: DeepMocked<OauthProviderResponseMapper>;

	const hydraUri = 'http://hydra.uri';
	const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(hydraUri);

		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderClientCrudUc,
					useValue: createMock<OauthProviderClientCrudUc>(),
				},
				{
					provide: OauthProviderResponseMapper,
					useValue: createMock<OauthProviderResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);
		uc = module.get(OauthProviderClientCrudUc);
		responseMapper = module.get(OauthProviderResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Client Flow', () => {
		describe('getOAuth2Client', () => {
			it('should get oauth2 client', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				uc.getOAuth2Client.mockResolvedValue(data);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse = await controller.getOAuth2Client(currentUser, { id: 'clientId' });

				expect(result).toEqual(data);
				expect(uc.getOAuth2Client).toHaveBeenCalledWith(currentUser, 'clientId');
			});
		});

		describe('listOAuth2Clients', () => {
			it('should list oauth2 clients when uc is called with all parameters', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				uc.listOAuth2Clients.mockResolvedValue([data]);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse[] = await controller.listOAuth2Clients(currentUser, {
					limit: 1,
					offset: 0,
					client_name: 'clientId',
					owner: 'clientOwner',
				});

				expect(result).toEqual([data]);
				expect(uc.listOAuth2Clients).toHaveBeenCalledWith(currentUser, 1, 0, 'clientId', 'clientOwner');
			});

			it('should list oauth2 clients when uc is called without parameters', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				uc.listOAuth2Clients.mockResolvedValue([data]);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse[] = await controller.listOAuth2Clients(currentUser, {});

				expect(result).toEqual([data]);
				expect(uc.listOAuth2Clients).toHaveBeenCalledWith(currentUser, undefined, undefined, undefined, undefined);
			});
		});

		describe('createOAuth2Client', () => {
			it('should create oauth2 client with defaults', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				uc.createOAuth2Client.mockResolvedValue(data);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse = await controller.createOAuth2Client(currentUser, data);

				expect(uc.createOAuth2Client).toHaveBeenCalledWith(currentUser, data);
				expect(result).toEqual(data);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should update oauth2 client with defaults', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				uc.updateOAuth2Client.mockResolvedValue(data);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse = await controller.updateOAuth2Client(
					currentUser,
					{ id: 'clientId' },
					{ client_id: 'clientId' }
				);

				expect(uc.updateOAuth2Client).toHaveBeenCalledWith(currentUser, 'clientId', data);
				expect(result).toEqual(data);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should delete oauth2 client', async () => {
				await controller.deleteOAuth2Client(currentUser, { id: 'clientId' });

				expect(uc.deleteOAuth2Client).toHaveBeenCalledWith(currentUser, 'clientId');
			});
		});
	});

	describe('Consent Flow', () => {
		describe('getConsentRequest', () => {
			it('should throw', () => {
				expect(() => controller.getConsentRequest({ challenge: '' })).toThrow(NotImplementedException);
			});
		});

		describe('patchConsentRequest', () => {
			it('should throw', () => {
				expect(() => controller.patchConsentRequest({ challenge: '' }, { accept: false }, {})).toThrow(
					NotImplementedException
				);
			});
		});

		describe('listConsentSessions', () => {
			it('should throw', () => {
				expect(() => controller.listConsentSessions({ userId: '' })).toThrow(NotImplementedException);
			});
		});

		describe('revokeConsentSession', () => {
			it('should throw', () => {
				expect(() => controller.revokeConsentSession({ userId: '' }, { client: '' })).toThrow(NotImplementedException);
			});
		});
	});

	describe('Login Flow', () => {
		describe('getLoginRequest', () => {
			it('should throw', () => {
				expect(() => controller.getLoginRequest({ challenge: '' })).toThrow(NotImplementedException);
			});
		});

		describe('patchLoginRequest', () => {
			it('should throw', () => {
				expect(() => controller.patchLoginRequest({ challenge: '' }, { accept: false }, {})).toThrow(
					NotImplementedException
				);
			});
		});
	});

	describe('Logout Flow', () => {
		describe('acceptLogoutRequest', () => {
			it('should throw', () => {
				expect(() => controller.acceptLogoutRequest({ challenge: '' }, { redirect_to: '' })).toThrow(
					NotImplementedException
				);
			});
		});
	});

	describe('introspectOAuth2Token', () => {
		it('should throw', () => {
			expect(() => controller.introspectOAuth2Token({ token: '' })).toThrow(NotImplementedException);
		});
	});

	describe('getUrl', () => {
		it('should return hydra uri', async () => {
			const result: string = await controller.getUrl();

			expect(result).toEqual(hydraUri);
		});
	});
});
