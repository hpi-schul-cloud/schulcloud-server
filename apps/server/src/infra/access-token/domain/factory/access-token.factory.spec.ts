import { AccessToken } from '../vo';
import { AccessTokenFactory } from './access-token.factory';

describe('AccessTokenFactory', () => {
	describe('build', () => {
		it('should return an instance of AccessToken', () => {
			const accessToken = AccessTokenFactory.build();

			expect(accessToken).toBeInstanceOf(AccessToken);
		});
	});
});
