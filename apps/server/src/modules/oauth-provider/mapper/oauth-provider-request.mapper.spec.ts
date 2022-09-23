import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import { OauthClient, OidcContext } from '@shared/infra/oauth-provider/dto';

describe('OauthProviderRequestMapper', () => {
	let mapper: OauthProviderRequestMapper;
	beforeAll(() => {
		mapper = new OauthProviderRequestMapper();
	});
	it('should be defined', () => {
		expect(mapper).toBeDefined();
	});

	describe('mapCreateAcceptLoginRequestBody', () => {
		const loginResponseMock = {
			challenge: 'challenge',
			client: {
				created_at: 'created_at',
				metadata: {},
			},
			oidc_context: { id_token_hint_claims: {} },
			request_url: 'request_url',
			requested_access_token_audience: ['requested_access_token_audience'],
			requested_scope: ['requested_scope'],
			session_id: 'session_id',
			skip: true,
			subject: 'subject',
		};
		const loginRequestBodyMock = {
			remember: true,
			remember_for: 0,
		};

		it('should create the AcceptLoginRequestBody', () => {});

		const create = OauthProviderRequestMapper.mapCreateAcceptLoginRequestBody(
			loginResponseMock,
			loginRequestBodyMock,
			'currentUserId',
			'pseudonym'
		);

		expect(create.acr).toBeUndefined();
		expect(create.remember).toStrictEqual(true);
		expect(create.remember).toBeTruthy();
		expect(create.subject).toStrictEqual('currentUserId');
		expect(create.force_subject_identifier).toStrictEqual('pseudonym');
		expect(create.context).toBeUndefined();
		expect(create.amr).toBeUndefined();
	});
});
