import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import { LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';

describe('OauthProviderRequestMapper', () => {
	let mapper: OauthProviderRequestMapper;
	beforeAll(() => {
		mapper = new OauthProviderRequestMapper();
	});

	describe('mapCreateAcceptLoginRequestBody', () => {
		const loginRequestBodyMock: LoginRequestBody = {
			remember: true,
			remember_for: 0,
		};

		it('should create the AcceptLoginRequestBody', () => {
			const create = OauthProviderRequestMapper.mapCreateAcceptLoginRequestBody(
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
});
