import { JwtRedisIdentifier } from './jwt-redis-identifier.vo';

describe(JwtRedisIdentifier.name, () => {
	describe('forJti', () => {
		it('should produce a key in the format jwt:<accountId>:<jti>', () => {
			const result = JwtRedisIdentifier.forJti('account123', 'jti456');

			expect(result.toString()).toBe('jwt:account123:jti456');
		});

		it('should include both accountId and jti in the key', () => {
			const accountId = 'abc';
			const jti = 'xyz';

			const result = JwtRedisIdentifier.forJti(accountId, jti);

			expect(result.toString()).toBe(`jwt:${accountId}:${jti}`);
		});
	});

	describe('forAccount', () => {
		it('should produce a wildcard pattern in the format jwt:<accountId>:*', () => {
			const result = JwtRedisIdentifier.forAccount('account123');

			expect(result.toString()).toBe('jwt:account123:*');
		});
	});

	describe('toString', () => {
		it('should return the string value', () => {
			const result = JwtRedisIdentifier.forJti('account123', 'jti456');

			expect(`${result.toString()}`).toBe('jwt:account123:jti456');
		});
	});
});
