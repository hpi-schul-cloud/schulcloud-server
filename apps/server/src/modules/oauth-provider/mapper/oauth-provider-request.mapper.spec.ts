import { AcceptLoginRequestBody } from '@shared/infra/oauth-provider/dto';
import { LoginRequestBody } from '../controller/dto';
import { OauthProviderRequestMapper } from './oauth-provider-request.mapper';

describe('OauthProviderRequestMapper', () => {
	describe('mapCreateAcceptLoginRequestBody', () => {
		it('should create the AcceptLoginRequestBody', () => {
			const loginRequestBodyMock: LoginRequestBody = {
				remember: true,
				remember_for: 0,
			};

			const result: AcceptLoginRequestBody = OauthProviderRequestMapper.mapCreateAcceptLoginRequestBody(
				loginRequestBodyMock,
				'currentUserId',
				'pseudonym',
				{ test: '123' }
			);

			expect(result).toEqual({
				remember: true,
				remember_for: 0,
				subject: 'currentUserId',
				force_subject_identifier: 'pseudonym',
				context: { test: '123' },
			});
		});
	});
});
