import {
	redactSecretPathParams,
	redactSecretQueryParams,
	redactSecretsInText,
	redactSecretsInUrl,
} from './url-path-secrets';

describe('url-path-secrets', () => {
	describe('redactSecretsInUrl', () => {
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
			['/users/linkImport/$2a$08$ab/CDEF.gh?x=1', '/users/linkImport/***?x=1'],
			['http://localhost:3030/api/v3/sharetoken/abc123', 'http://localhost:3030/api/v3/sharetoken/***'],
			['https://host.example/passwordRecovery/tok?x=1', 'https://host.example/passwordRecovery/***?x=1'],
			[
				'/room-invitation-links?roomInvitationLinkIds=a&roomInvitationLinkIds=b',
				'/room-invitation-links?roomInvitationLinkIds=***&roomInvitationLinkIds=***',
			],
			['/room-invitation-links?roomInvitationLinkIds[]=a', '/room-invitation-links?roomInvitationLinkIds[]=***'],
			[
				'/room-invitation-links?roomInvitationLinkIds[0]=a&roomInvitationLinkIds[1]=b',
				'/room-invitation-links?roomInvitationLinkIds[0]=***&roomInvitationLinkIds[1]=***',
			],
			[
				'/room-invitation-links?roomInvitationLinkIds%5B0%5D=a&roomInvitationLinkIds%5b1%5d=b',
				'/room-invitation-links?roomInvitationLinkIds%5B0%5D=***&roomInvitationLinkIds%5b1%5d=***',
			],
			[
				'/room-invitation-links?x=1&roomInvitationLinkIds%5B%5D=a#f',
				'/room-invitation-links?x=1&roomInvitationLinkIds%5B%5D=***#f',
			],
			['/link/shortId', '/link/***'],
		])('should redact the secret in %s', (url, expected) => {
			expect(redactSecretsInUrl(url)).toBe(expected);
		});

		it.each([
			'/rooms/1?ids=a&ids=b',
			'/sharetoken',
			'/sharetoken?parentId=1',
			'/registrations',
			'/room-invitation-links',
			'/rooms/1/room-invitation-links',
			'/room-invitation-links?otherIds=a',
			'/passwordRecovery/reset',
			'/passwordRecovery/api',
			'/link/api',
			'/link',
			'/users/linkImport',
			'/other/sharetoken/abc',
			'http://host/other/sharetoken/abc',
		])('should not change %s', (url) => {
			expect(redactSecretsInUrl(url)).toBe(url);
		});

		it('should return non-string values unchanged', () => {
			expect(redactSecretsInUrl(undefined)).toBeUndefined();
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

	describe('redactSecretQueryParams', () => {
		it('should redact query params that carry a path secret', () => {
			const query = { roomInvitationLinkIds: ['a', 'b'], other: 'c' };

			const result = redactSecretQueryParams(query);

			expect(result).toEqual({ roomInvitationLinkIds: '***', other: 'c' });
			expect(query.roomInvitationLinkIds).toEqual(['a', 'b']);
		});
	});

	describe('redactSecretsInText', () => {
		it.each([
			['Cannot POST /api/v3/sharetoken/abc123', 'Cannot POST /api/v3/sharetoken/***'],
			['Cannot GET /api/v3/registrations/by-secret/s3cr3t/typo', 'Cannot GET /api/v3/registrations/by-secret/***/typo'],
			[
				'NotFoundException: Cannot GET /api/v3/sharetoken/abc123\n    at callback (routes-resolver.js:77:19)',
				'NotFoundException: Cannot GET /api/v3/sharetoken/***\n    at callback (routes-resolver.js:77:19)',
			],
			['url "/link/shortId" failed', 'url "/link/***" failed'],
			[
				'Cannot DELETE /api/v3/room-invitation-links?roomInvitationLinkIds=a&roomInvitationLinkIds[1]=b now',
				'Cannot DELETE /api/v3/room-invitation-links?roomInvitationLinkIds=***&roomInvitationLinkIds[1]=*** now',
			],
		])('should redact the secret in %s', (text, expected) => {
			expect(redactSecretsInText(text)).toBe(expected);
		});

		it.each(['Cannot GET /api/v3/rooms/1', 'Cannot GET /other/sharetoken/abc', 'see sharetoken/abc'])(
			'should not change %s',
			(text) => {
				expect(redactSecretsInText(text)).toBe(text);
			}
		);
	});
});
