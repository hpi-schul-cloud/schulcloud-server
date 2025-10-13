import { AccessToken } from './access-token.vo';

describe('AccessToken', () => {
	describe('constructor', () => {
		it('should assign the token property with uuid', () => {
			const accessToken = new AccessToken();

			expect(accessToken.token).toEqual(expect.any(String));
			expect(accessToken.token.length).toBe(24);
		});
	});
});
