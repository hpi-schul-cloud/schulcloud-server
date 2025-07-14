import { AccessToken } from '../access-token.vo';

describe('AccessToken', () => {
	describe('constructor', () => {
		describe('when called with a valid UUID token', () => {
			it('should assign the token property', () => {
				const validToken = '123e4567-e89b-12d3-a456-426614174000';

				const accessToken = new AccessToken(validToken);

				expect(accessToken.token).toBe(validToken);
			});
		});

		describe('when called with an invalid token', () => {
			it('should fail class-validator validation', () => {
				const invalidToken = 'not-a-uuid';

				expect(() => new AccessToken(invalidToken)).toThrow();
			});
		});
	});
});
