import { EntityManager } from '@mikro-orm/mongodb';
import { OAUTH_PROVIDER_CONFIG_TOKEN, OauthProviderConfig } from '@modules/oauth-provider/oauth-provider-config';
import { externalToolPseudonymEntityFactory } from '@modules/pseudonym/testing';
import { ServerTestModule } from '@modules/server';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
} from '../../domain';
import {
	providerConsentResponseFactory,
	providerConsentSessionResponseFactory,
	providerLoginResponseFactory,
	providerOauthClientFactory,
} from '../../testing';
import { OauthProviderController } from '../oauth-provider.controller';

describe(OauthProviderController.name, () => {
	let app: INestApplication;
	let em: EntityManager;
	let axiosMock: MockAdapter;
	let testApiClient: TestApiClient;
	let configModule: OauthProviderConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'oauth2');
		configModule = app.get<OauthProviderConfig>(OAUTH_PROVIDER_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		axiosMock = new MockAdapter(axios);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getOAuth2Client', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const clientId = 'oauth2ClientId';

				const response = await testApiClient.get(`clients/${clientId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when reading an oauth2 client', () => {
			const setup = async () => {
				const clientId = 'oauth2ClientId';
				const client: ProviderOauthClient = providerOauthClientFactory.build({
					client_id: clientId,
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin(undefined, [
					Permission.OAUTH_CLIENT_VIEW,
					Permission.OAUTH_CLIENT_EDIT,
				]);

				axiosMock
					.onGet(`${configModule.hydraUri}/clients/${clientId}`)
					.replyOnce<ProviderOauthClient>(HttpStatus.OK, client);

				await em.persist([adminAccount, adminUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					clientId,
					loggedInClient,
					client,
				};
			};

			it('should return the client', async () => {
				const { loggedInClient, clientId, client } = await setup();

				const response = await loggedInClient.get(`clients/${clientId}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({ ...client, client_secret: undefined });
				expect('client_secret' in response.body).toEqual(false);
			});
		});
	});

	describe('listOAuth2Clients', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const response = await testApiClient.get(`clients`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when reading all oauth2 clients', () => {
			const setup = async () => {
				const clients: ProviderOauthClient[] = providerOauthClientFactory.buildList(2, {
					client_secret: undefined,
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin(undefined, [
					Permission.OAUTH_CLIENT_VIEW,
					Permission.OAUTH_CLIENT_EDIT,
				]);

				axiosMock.onGet(`${configModule.hydraUri}/clients`).replyOnce<ProviderOauthClient[]>(HttpStatus.OK, clients);

				await em.persist([adminAccount, adminUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					clients,
				};
			};

			it('should return the client', async () => {
				const { loggedInClient, clients } = await setup();

				const response = await loggedInClient.get(`clients`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(clients);
			});
		});
	});

	describe('createOAuth2Client', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const response = await testApiClient.post(`clients`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when creating an oauth2 client', () => {
			const setup = async () => {
				const client: ProviderOauthClient = providerOauthClientFactory.build();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin(undefined, [
					Permission.OAUTH_CLIENT_VIEW,
					Permission.OAUTH_CLIENT_EDIT,
				]);

				axiosMock.onPost(`${configModule.hydraUri}/clients`).replyOnce<ProviderOauthClient>(HttpStatus.OK, client);

				await em.persist([adminAccount, adminUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					client,
				};
			};

			it('should return the client', async () => {
				const { loggedInClient, client } = await setup();

				const response = await loggedInClient.post(`clients`, client);

				expect(response.status).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual({ ...client, client_secret: undefined });
				expect('client_secret' in response.body).toEqual(false);
			});
		});
	});

	describe('updateOAuth2Client', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const clientId = 'oauth2ClientId';

				const response = await testApiClient.put(`clients/${clientId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when updating an oauth2 client', () => {
			const setup = async () => {
				const clientId = 'oauth2ClientId';
				const client: ProviderOauthClient = providerOauthClientFactory.build({
					client_id: undefined,
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin(undefined, [
					Permission.OAUTH_CLIENT_VIEW,
					Permission.OAUTH_CLIENT_EDIT,
				]);

				axiosMock
					.onPut(`${configModule.hydraUri}/clients/${clientId}`)
					.replyOnce<ProviderOauthClient>(HttpStatus.OK, client);

				await em.persist([adminAccount, adminUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					client,
					clientId,
				};
			};

			it('should return the client', async () => {
				const { loggedInClient, client, clientId } = await setup();

				const response = await loggedInClient.put(`clients/${clientId}`, client);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({ ...client, client_secret: undefined });
				expect('client_secret' in response.body).toEqual(false);
			});
		});
	});

	describe('deleteOAuth2Client', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const clientId = 'oauth2ClientId';

				const response = await testApiClient.delete(`clients/${clientId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when deleting an oauth2 client', () => {
			const setup = async () => {
				const clientId = 'oauth2ClientId';
				const client: ProviderOauthClient = providerOauthClientFactory.build({
					client_id: undefined,
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin(undefined, [
					Permission.OAUTH_CLIENT_VIEW,
					Permission.OAUTH_CLIENT_EDIT,
				]);

				axiosMock.onDelete(`${configModule.hydraUri}/clients/${clientId}`).replyOnce<void>(HttpStatus.OK);

				await em.persist([adminAccount, adminUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					client,
					clientId,
				};
			};

			it('should delete the client', async () => {
				const { loggedInClient, clientId } = await setup();

				const response = await loggedInClient.delete(`clients/${clientId}`);

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
			});
		});
	});

	describe('getLoginRequest', () => {
		describe('when getting a login request', () => {
			const setup = async () => {
				const challenge = 'challenge';
				const loginResponse: ProviderLoginResponse = providerLoginResponseFactory.build({
					challenge,
				});
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				axiosMock
					.onGet(`${configModule.hydraUri}/oauth2/auth/requests/login?login_challenge=${challenge}`)
					.replyOnce<ProviderLoginResponse>(HttpStatus.OK, loginResponse);

				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					challenge,
					loginResponse,
				};
			};

			it('should return the login response', async () => {
				const { loggedInClient, challenge, loginResponse } = await setup();

				const response = await loggedInClient.get(`loginRequest/${challenge}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({ ...loginResponse, client_id: loginResponse.client.client_id });
			});
		});
	});

	describe('patchLoginRequest', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const challenge = 'challenge';

				const response = await testApiClient.patch(`loginRequest/${challenge}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when accepting a login request', () => {
			const setup = async () => {
				const challenge = 'challenge';
				const clientId = 'clientId';
				const loginResponse: ProviderLoginResponse = providerLoginResponseFactory.build({
					client: providerOauthClientFactory.build({ client_id: clientId }),
					challenge,
				});
				const externalTool = externalToolEntityFactory.withOauth2Config({ clientId }).build();
				const redirectResponse: ProviderRedirectResponse = { redirect_to: 'redirect' };
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				axiosMock
					.onGet(`${configModule.hydraUri}/oauth2/auth/requests/login?login_challenge=${challenge}`)
					.replyOnce<ProviderLoginResponse>(HttpStatus.OK, loginResponse)
					.onPut(`${configModule.hydraUri}/oauth2/auth/requests/login/accept?login_challenge=${challenge}`)
					.replyOnce<ProviderRedirectResponse>(HttpStatus.OK, redirectResponse);

				await em.persist([studentAccount, studentUser, externalTool]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					challenge,
					redirectResponse,
				};
			};

			it('should return a redirect', async () => {
				const { loggedInClient, challenge, redirectResponse } = await setup();

				const response = await loggedInClient.patch(`loginRequest/${challenge}?accept=true`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(redirectResponse);
			});
		});
	});

	describe('acceptLogoutRequest', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const challenge = 'challenge';

				const response = await testApiClient.patch(`logoutRequest/${challenge}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when accepting a logout request', () => {
			const setup = async () => {
				const challenge = 'challenge';
				const redirectResponse: ProviderRedirectResponse = { redirect_to: 'redirect' };
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				axiosMock
					.onPut(`${configModule.hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=${challenge}`)
					.replyOnce<ProviderRedirectResponse>(HttpStatus.OK, redirectResponse);

				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					challenge,
					redirectResponse,
				};
			};

			it('should return a redirect', async () => {
				const { loggedInClient, challenge, redirectResponse } = await setup();

				const response = await loggedInClient.patch(`logoutRequest/${challenge}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(redirectResponse);
			});
		});
	});

	describe('getConsentRequest', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const challenge = 'challenge';

				const response = await testApiClient.patch(`consentRequest/${challenge}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when getting a consent request', () => {
			const setup = async () => {
				const challenge = 'challenge';
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const consentResponse: ProviderConsentResponse = providerConsentResponseFactory.build({
					challenge,
					subject: studentUser.id,
				});

				axiosMock
					.onGet(`${configModule.hydraUri}/oauth2/auth/requests/consent?consent_challenge=${challenge}`)
					.replyOnce<ProviderConsentResponse>(HttpStatus.OK, consentResponse);

				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					challenge,
					consentResponse,
				};
			};

			it('should delete the client', async () => {
				const { loggedInClient, challenge, consentResponse } = await setup();

				const response = await loggedInClient.get(`consentRequest/${challenge}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(consentResponse);
			});
		});
	});

	describe('patchConsentRequest', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const challenge = 'challenge';

				const response = await testApiClient.patch(`consentRequest/${challenge}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when accepting a consent request', () => {
			const setup = async () => {
				const challenge = 'challenge';
				const clientId = 'clientId';
				const externalTool = externalToolEntityFactory.withOauth2Config({ clientId }).build();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const pseudonym = externalToolPseudonymEntityFactory.build({ toolId: externalTool.id, userId: studentUser.id });
				const consentResponse: ProviderConsentResponse = providerConsentResponseFactory.build({
					client: providerOauthClientFactory.build({ client_id: clientId }),
					challenge,
					subject: studentUser.id,
				});
				const redirectResponse: ProviderRedirectResponse = { redirect_to: 'redirect' };

				axiosMock
					.onGet(`${configModule.hydraUri}/oauth2/auth/requests/consent?consent_challenge=${challenge}`)
					.replyOnce<ProviderConsentResponse>(HttpStatus.OK, consentResponse)
					.onPut(`${configModule.hydraUri}/oauth2/auth/requests/consent/accept?consent_challenge=${challenge}`)
					.replyOnce<ProviderRedirectResponse>(HttpStatus.OK, redirectResponse);

				await em.persist([studentAccount, studentUser, externalTool, pseudonym]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					challenge,
					redirectResponse,
				};
			};

			it('should return a redirect', async () => {
				const { loggedInClient, challenge, redirectResponse } = await setup();

				const response = await loggedInClient.patch(`consentRequest/${challenge}?accept=true`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(redirectResponse);
			});
		});
	});

	describe('listConsentSessions', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const response = await testApiClient.get(`auth/sessions/consent`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when listing all consent sessions', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const consentListResponse: ProviderConsentSessionResponse = providerConsentSessionResponseFactory.build();
				const externalTool = externalToolEntityFactory.withOauth2Config().buildWithId();
				const pseudonym = externalToolPseudonymEntityFactory.buildWithId({
					toolId: externalTool.id,
					userId: studentUser.id,
				});

				axiosMock
					.onGet(`${configModule.hydraUri}/oauth2/auth/sessions/consent?subject=${studentUser.id}`)
					.replyOnce<ProviderConsentSessionResponse[]>(HttpStatus.OK, [consentListResponse]);

				await em.persist([studentAccount, studentUser, externalTool, pseudonym]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					consentListResponse,
				};
			};

			it('should return a list of all consent sessions', async () => {
				const { loggedInClient, consentListResponse } = await setup();

				const response = await loggedInClient.get(`auth/sessions/consent`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual([
					{
						challenge: consentListResponse.consent_request.challenge,
						client_id: consentListResponse.consent_request.client.client_id,
						client_name: consentListResponse.consent_request.client.client_name,
					},
				]);
			});
		});
	});

	describe('revokeConsentSession', () => {
		describe('when no user is logged in', () => {
			it('should return unauthorized', async () => {
				const response = await testApiClient.delete(`auth/sessions/consent`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when revoking all consent sessions for a client', () => {
			const setup = async () => {
				const clientId = 'clientId';
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				axiosMock
					.onDelete(
						`${configModule.hydraUri}/oauth2/auth/sessions/consent?subject=${studentUser.id}&client=${clientId}`
					)
					.replyOnce<void>(HttpStatus.OK);

				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					clientId,
				};
			};

			it('should delete all sessions for a client', async () => {
				const { loggedInClient, clientId } = await setup();

				const response = await loggedInClient.delete(`auth/sessions/consent?client=${clientId}`);

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});
	});
});
