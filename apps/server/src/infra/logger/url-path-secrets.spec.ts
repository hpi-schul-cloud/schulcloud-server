import { redactSecretPathParams, redactSecretsInUrlPath } from './url-path-secrets';

describe('url-path-secrets', () => {
	describe('redactSecretsInUrlPath', () => {
		it.each([
			['/sharetoken/abc123', '/sharetoken/***'],
			['/sharetoken/abc123/import', '/sharetoken/***/import'],
			['/api/v3/sharetoken/abc123?foo=bar', '/api/v3/sharetoken/***?foo=bar'],
			['/ShareToken/abc123', '/ShareToken/***'],
			['/registrations/by-secret/s3cr3t', '/registrations/by-secret/***'],
			['/registrations/by-secret/s3cr3t/complete', '/registrations/by-secret/***/complete'],
			['/authorization/resolve-token/tok/ttl/60', '/authorization/resolve-token/***/ttl/60'],
			['/room-invitation-links/linkId', '/room-invitation-links/***'],
			['/passwordRecovery/tok', '/passwordRecovery/***'],
			['/api/v1/passwordRecovery/tok', '/api/v1/passwordRecovery/***'],
			['/legacy/v1/passwordRecovery/tok', '/legacy/v1/passwordRecovery/***'],
			['/users/linkImport/hash?x=1', '/users/linkImport/***?x=1'],
			['http://localhost:3030/api/v3/sharetoken/abc123', 'http://localhost:3030/api/v3/sharetoken/***'],
			['https://host.example/passwordRecovery/tok?x=1', 'https://host.example/passwordRecovery/***?x=1'],
			['/link/shortId', '/link/***'],
		])('should redact the secret in %s', (url, expected) => {
			expect(redactSecretsInUrlPath(url)).toBe(expected);
		});

		it.each([
			'/rooms/1?ids=a&ids=b',
			'/sharetoken',
			'/sharetoken?parentId=1',
			'/registrations',
			'/room-invitation-links',
			'/rooms/1/room-invitation-links',
			'/passwordRecovery/reset',
			'/passwordRecovery/api',
			'/link/api',
			'/link',
			'/users/linkImport',
			'/other/sharetoken/abc',
			'http://host/other/sharetoken/abc',
		])('should not change %s', (url) => {
			expect(redactSecretsInUrlPath(url)).toBe(url);
		});

		it('should return non-string values unchanged', () => {
			expect(redactSecretsInUrlPath(undefined)).toBeUndefined();
		});
	});

	describe('redactSecretPathParams', () => {
		it('should redact params that hold a secret', () => {
			const params = { token: 'abc', registrationSecret: 's3cr3t', roomInvitationLinkId: 'id', roomId: '1' };

			const result = redactSecretPathParams(params);

			expect(result).toEqual({ token: '***', registrationSecret: '***', roomInvitationLinkId: '***', roomId: '1' });
		});

		it('should not change the passed object', () => {
			const params = { token: 'abc' };

			redactSecretPathParams(params);

			expect(params).toEqual({ token: 'abc' });
		});

		it('should return non-object values unchanged', () => {
			expect(redactSecretPathParams(undefined)).toBeUndefined();
		});
	});
});
