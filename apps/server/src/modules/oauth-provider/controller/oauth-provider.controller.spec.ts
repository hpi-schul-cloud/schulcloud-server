import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderLogoutFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.logout-flow.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotImplementedException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { ICurrentUser } from '@shared/domain';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderController } from './oauth-provider.controller';
import { ConsentSessionResponse, OauthClientBody, OauthClientResponse } from './dto';
import { OauthProviderClientCrudUc } from '../uc/oauth-provider.client-crud.uc';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;

	let oauthProviderUc: DeepMocked<OauthProviderUc>;
	let crudUc: DeepMocked<OauthProviderClientCrudUc>;
	let logoutFlowUc: DeepMocked<OauthProviderLogoutFlowUc>;
	let responseMapper: DeepMocked<OauthProviderResponseMapper>;

	const hydraUri = 'http://hydra.uri';
	const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(hydraUri);

		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderUc,
					useValue: createMock<OauthProviderUc>(),
				},
				{
					provide: OauthProviderClientCrudUc,
					useValue: createMock<OauthProviderClientCrudUc>(),
				},
				{
					provide: OauthProviderLogoutFlowUc,
					useValue: createMock<OauthProviderLogoutFlowUc>(),
				},
				{
					provide: OauthProviderResponseMapper,
					useValue: createMock<OauthProviderResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);
		oauthProviderUc = module.get(OauthProviderUc);
		crudUc = module.get(OauthProviderClientCrudUc);
		logoutFlowUc = module.get(OauthProviderLogoutFlowUc);
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
				crudUc.getOAuth2Client.mockResolvedValue(data);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse = await controller.getOAuth2Client(currentUser, { id: 'clientId' });

				expect(result).toEqual(data);
				expect(crudUc.getOAuth2Client).toHaveBeenCalledWith(currentUser, 'clientId');
			});
		});

		describe('listOAuth2Clients', () => {
			it('should list oauth2 clients when uc is called with all parameters', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				crudUc.listOAuth2Clients.mockResolvedValue([data]);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse[] = await controller.listOAuth2Clients(currentUser, {
					limit: 1,
					offset: 0,
					client_name: 'clientId',
					owner: 'clientOwner',
				});

				expect(result).toEqual([data]);
				expect(crudUc.listOAuth2Clients).toHaveBeenCalledWith(currentUser, 1, 0, 'clientId', 'clientOwner');
			});

			it('should list oauth2 clients when uc is called without parameters', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				crudUc.listOAuth2Clients.mockResolvedValue([data]);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse[] = await controller.listOAuth2Clients(currentUser, {});

				expect(result).toEqual([data]);
				expect(crudUc.listOAuth2Clients).toHaveBeenCalledWith(currentUser, undefined, undefined, undefined, undefined);
			});
		});

		describe('createOAuth2Client', () => {
			it('should create oauth2 client with defaults', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				crudUc.createOAuth2Client.mockResolvedValue(data);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse = await controller.createOAuth2Client(currentUser, data);

				expect(crudUc.createOAuth2Client).toHaveBeenCalledWith(currentUser, data);
				expect(result).toEqual(data);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should update oauth2 client with defaults', async () => {
				const data: OauthClientBody = {
					client_id: 'clientId',
				};
				crudUc.updateOAuth2Client.mockResolvedValue(data);
				responseMapper.mapOauthClientToClientResponse.mockReturnValue(new OauthClientResponse({ ...data }));

				const result: OauthClientResponse = await controller.updateOAuth2Client(
					currentUser,
					{ id: 'clientId' },
					{ client_id: 'clientId' }
				);

				expect(crudUc.updateOAuth2Client).toHaveBeenCalledWith(currentUser, 'clientId', data);
				expect(result).toEqual(data);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should delete oauth2 client', async () => {
				await controller.deleteOAuth2Client(currentUser, { id: 'clientId' });

				expect(crudUc.deleteOAuth2Client).toHaveBeenCalledWith(currentUser, 'clientId');
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
			it('should list all consent sessions', async () => {
				const session: ProviderConsentSessionResponse = {
					consent_request: {
						challenge: 'challenge',
						client: {
							client_id: 'clientId',
							client_name: 'clientName',
						},
					},
				};
				const response: ConsentSessionResponse = new ConsentSessionResponse({
					challenge: 'challenge',
					client_id: 'clientId',
					client_name: 'clientName',
				});
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

				oauthProviderUc.listConsentSessions.mockResolvedValue([session]);
				responseMapper.mapConsentSessionsToResponse.mockReturnValue(response);

				const result: ConsentSessionResponse[] = await controller.listConsentSessions(currentUser);

				expect(result).toEqual([response]);
				expect(oauthProviderUc.listConsentSessions).toHaveBeenCalledWith(currentUser.userId);
			});
		});

		describe('revokeConsentSession', () => {
			it('should revoke consent sessions', async () => {
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

				await controller.revokeConsentSession(currentUser, { client: 'clientId' });

				expect(oauthProviderUc.revokeConsentSession).toHaveBeenCalledWith(currentUser.userId, 'clientId');
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
			it('should call uc and return redirect string', async () => {
				logoutFlowUc.logoutFlow.mockResolvedValue({ redirect_to: 'www.mock.de' });

				const redirect = await controller.acceptLogoutRequest(
					{ challenge: 'challenge_mock' },
					{ redirect_to: 'www.mock.de' }
				);

				expect(logoutFlowUc.logoutFlow).toHaveBeenCalledWith('challenge_mock');
				expect(redirect).toEqual('www.mock.de');
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
