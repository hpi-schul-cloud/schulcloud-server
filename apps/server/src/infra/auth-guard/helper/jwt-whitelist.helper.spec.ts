import { createJwtRedisData, createJwtRedisIdentifier } from './jwt-whitelist.helper';

describe('createJwtRedisIdentifier', () => {
	it('should return a string in the format jwt:<accountId>:<jti>', () => {
		const result = createJwtRedisIdentifier('account123', 'jti456');
		expect(result).toBe('jwt:account123:jti456');
	});

	it('should include both accountId and jti in the identifier', () => {
		const accountId = 'abc';
		const jti = 'xyz';
		expect(createJwtRedisIdentifier(accountId, jti)).toBe(`jwt:${accountId}:${jti}`);
	});
});

describe('createJwtRedisData', () => {
	it('should return JwtRedisData with NONE placeholders and given expiration', () => {
		const result = createJwtRedisData(3600);
		expect(result).toEqual({
			IP: 'NONE',
			Browser: 'NONE',
			Device: 'NONE',
			privateDevice: false,
			expirationInSeconds: 3600,
		});
	});

	it('should default privateDevice to false', () => {
		const result = createJwtRedisData(100);
		expect(result.privateDevice).toBe(false);
	});

	it('should set privateDevice to true when passed as true', () => {
		const result = createJwtRedisData(100, true);
		expect(result.privateDevice).toBe(true);
	});

	it('should set expirationInSeconds to the provided value', () => {
		const result = createJwtRedisData(7200);
		expect(result.expirationInSeconds).toBe(7200);
	});
});
