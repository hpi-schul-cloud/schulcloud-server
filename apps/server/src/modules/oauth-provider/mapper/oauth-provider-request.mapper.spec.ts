import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import { LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { AcceptLoginRequestBody } from '@shared/infra/oauth-provider/dto/index';

describe('OauthProviderRequestMapper', () => {
	let mapper: OauthProviderRequestMapper;
	beforeAll(() => {
		mapper = new OauthProviderRequestMapper();
	});

	describe('mapCreateAcceptLoginRequestBody', () => {
		it('should create the AcceptLoginRequestBody', () => {
			const loginRequestBodyMock: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};

			const result: AcceptLoginRequestBody = mapper.mapCreateAcceptLoginRequestBody(
				loginRequestBodyMock,
				'currentUserId',
				'pseudonym'
			);

			expect(result).toEqual({
				remember: true,
				remember_for: 0,
				subject: 'currentUserId',
				force_subject_identifier: 'pseudonym',
			});
		});
	});
});
