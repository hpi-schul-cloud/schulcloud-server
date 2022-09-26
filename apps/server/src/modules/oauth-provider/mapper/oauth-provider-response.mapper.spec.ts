import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import {
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	ProviderLoginResponse,
} from '@shared/infra/oauth-provider/dto';
import {
	ConsentResponse,
	ConsentSessionResponse,
	OauthClientResponse,
	RedirectResponse,
	LoginResponse,
} from '@src/modules/oauth-provider/controller/dto/';

describe('OauthProviderResponseMapper', () => {
	let mapper: OauthProviderResponseMapper;

	beforeAll(() => {
		mapper = new OauthProviderResponseMapper();
	});

	it('mapRedirectResponse', () => {
		const providerResponse: ProviderRedirectResponse = { redirect_to: 'anywhere' };

		const result: RedirectResponse = mapper.mapRedirectResponse(providerResponse);

		expect(result.redirect_to).toEqual(providerResponse.redirect_to);
	});

	it('mapConsentResponse', () => {
		const providerConsentResponse: ProviderConsentResponse = {
			acr: 'acr',
			amr: ['amr'],
			challenge: 'challenge',
			client: {},
			context: {},
			login_challenge: 'login_challenge',
			login_session_id: 'login_session_id',
			oidc_context: {},
			request_url: 'request_url',
			requested_access_token_audience: ['requested_access_token_audience'],
			requested_scope: ['requested_scope'],
			skip: true,
			subject: 'subject',
		};

		const result: ConsentResponse = mapper.mapConsentResponse(providerConsentResponse);

		expect(result).toEqual(new ConsentResponse({ ...providerConsentResponse }));
	});

	it('mapOauthClientResponseSpec', () => {
		const providerOauthClientResponse: ProviderOauthClient = {
			allowed_cors_origins: ['allowed_cors_origins'],
			audience: ['audience'],
			authorization_code_grant_access_token_lifespan: 'authorization_code_grant_access_token_lifespan',
			authorization_code_grant_id_token_lifespan: 'authorization_code_grant_id_token_lifespan',
			authorization_code_grant_refresh_token_lifespan: 'authorization_code_grant_refresh_token_lifespan',
			backchannel_logout_session_required: true,
			backchannel_logout_uri: 'backchannel_logout_uri',
			client_credentials_grant_access_token_lifespan: 'client_credentials_grant_access_token_lifespan',
			client_id: 'client_id',
			client_name: 'client_name',
			client_secret: 'client_secret',
			client_secret_expires_at: 5,
			client_uri: 'client_uri',
			contacts: ['contacts'],
			created_at: 'created_at',
			frontchannel_logout_session_required: true,
			frontchannel_logout_uri: 'frontchannel_logout_uri',
			grant_types: ['grant_types'],
			implicit_grant_access_token_lifespan: 'implicit_grant_access_token_lifespan',
			implicit_grant_id_token_lifespan: 'implicit_grant_id_token_lifespan',
			jwks: {},
			jwks_uri: 'jwks_uri',
			jwt_bearer_grant_access_token_lifespan: 'jwt_bearer_grant_access_token_lifespan',
			logo_uri: 'logo_uri',
			metadata: {},
			owner: 'owner',
			password_grant_access_token_lifespan: 'password_grant_access_token_lifespan',
			password_grant_refresh_token_lifespan: 'password_grant_refresh_token_lifespan',
			policy_uri: 'policy_uri',
			post_logout_redirect_uris: ['post_logout_redirect_uris'],
			redirect_uris: ['redirect_uris'],
			refresh_token_grant_access_token_lifespan: 'refresh_token_grant_access_token_lifespan',
			refresh_token_grant_id_token_lifespan: 'refresh_token_grant_id_token_lifespan',
			refresh_token_grant_refresh_token_lifespan: 'refresh_token_grant_refresh_token_lifespan',
			registration_access_token: 'registration_access_token',
			registration_client_uri: 'registration_client_uri',
			request_object_signing_alg: 'request_object_signing_alg',
			request_uris: ['request_uris'],
			response_types: ['response_types'],
			scope: 'scope',
			sector_identifier_uri: 'sector_identifier_uri',
			subject_type: 'subject_type',
			token_endpoint_auth_method: 'token_endpoint_auth_method',
			token_endpoint_auth_signing_alg: 'token_endpoint_auth_signing_alg',
			tos_uri: 'tos_uri',
			updated_at: 'updated_at',
			userinfo_signed_response_alg: 'userinfo_signed_response_alg',
		};

		const result: OauthClientResponse = mapper.mapOauthClientResponse(providerOauthClientResponse);

		expect(result).toEqual(expect.objectContaining(providerOauthClientResponse));
	});

	it('mapConsentSessionsToResponse', () => {
		const session: ProviderConsentSessionResponse = {
			consent_request: {
				challenge: 'challenge',
				client: {
					client_id: 'clientId',
					client_name: 'clientName',
				},
			},
		};

		const response: ConsentSessionResponse = mapper.mapConsentSessionsToResponse(session);

		expect(response).toEqual(
			expect.objectContaining<ConsentSessionResponse>({
				challenge: 'challenge',
				client_id: 'clientId',
				client_name: 'clientName',
			})
		);
	});

	it('mapOauthClientResponse', () => {
		const providerLoginResponse: ProviderLoginResponse = {
			challenge: 'challenge',
			client: {},
			oidc_context: {},
			request_url: 'request_url',
			requested_access_token_audience: ['requested_access_token_audience'],
			requested_scope: ['requested_scope'],
			session_id: 'session_id',
		} as ProviderLoginResponse;

		const result: LoginResponse = mapper.mapLoginResponse(providerLoginResponse);

		expect(result).toEqual(expect.objectContaining(providerLoginResponse));
	});
});
