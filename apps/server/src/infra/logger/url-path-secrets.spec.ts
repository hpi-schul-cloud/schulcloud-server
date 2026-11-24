import { redactSecretPathParams, redactSecretQueryParams, redactSecretsInText } from './url-path-secrets';

describe('url-path-secrets', () => {
	describe('redactSecretsInText with a url', () => {
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
			['/registrationPins?email=a&pin=1234', '/registrationPins?email=a&pin=***'],
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
			expect(redactSecretsInText(url)).toBe(expected);
		});

		it.each([
			'/rooms/1?ids=a&ids=b',
			'/sharetoken',
			'/sharetoken?parentId=1',
			'/registrations',
			'/room-invitation-links',
			'/rooms/1/room-invitation-links',
			'/room-invitation-links?otherIds=a',
			'/registrationPins?pinned=1',
			'/passwordRecovery/reset',
			'/passwordRecovery/api',
			'/link/api',
			'/link',
			'/users/linkImport',
			'/other/sharetoken/abc',
			'http://host/other/sharetoken/abc',
		])('should not change %s', (url) => {
			expect(redactSecretsInText(url)).toBe(url);
		});

		it('should return non-string values unchanged', () => {
			expect(redactSecretsInText(undefined)).toBeUndefined();
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
		it('should redact query params with a sensitive name', () => {
			const query = { shareToken: 'x', accessToken: 'y', page: '2' };

			const result = redactSecretQueryParams(query);

			expect(result).toEqual({ shareToken: '***', accessToken: '***', page: '2' });
		});

		it('should redact query params that carry a path secret', () => {
			const query = { roomInvitationLinkIds: ['a', 'b'], pin: '1234', other: 'c' };

			const result = redactSecretQueryParams(query);

			expect(result).toEqual({ roomInvitationLinkIds: '***', pin: '***', other: 'c' });
			expect(query.roomInvitationLinkIds).toEqual(['a', 'b']);
		});
	});

	describe('redactSecretsInText with a longer text', () => {
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
			['/api/v3//sharetoken/abc', '/api/v3//sharetoken/***'],
			['//registrations//by-secret/s3cr3t', '//registrations//by-secret/***'],
			['url: /sharetoken/abc, next', 'url: /sharetoken/***, next'],
			['(/sharetoken/abc)', '(/sharetoken/***)'],
			['[/sharetoken/abc]', '[/sharetoken/***]'],
			['`/sharetoken/abc`', '`/sharetoken/***`'],
			['</sharetoken/abc>', '</sharetoken/***>'],
			['url=/sharetoken/abc;', 'url=/sharetoken/***;'],
			['/sharetoken/abc: not found', '/sharetoken/***: not found'],
			[
				'{"message":"Cannot GET /api/v3/sharetoken/abc","stack":"NotFoundException: Cannot GET /api/v3/sharetoken/abc\\n    at x"}',
				'{"message":"Cannot GET /api/v3/sharetoken/***","stack":"NotFoundException: Cannot GET /api/v3/sharetoken/***\\n    at x"}',
			],
			['{"url":"\\"/link/abc\\""}', '{"url":"\\"/link/***\\""}'],
			['first\\n/sharetoken/abc', 'first\\n/sharetoken/***'],
			['/rooms?shareToken=x&accessToken=y&page=2', '/rooms?shareToken=***&accessToken=***&page=2'],
			['GET /files?token=abc#top', 'GET /files?token=***#top'],
			['"url":"/x?access_token=abc\\n"', '"url":"/x?access_token=***\\n"'],
		])('should redact the secret in %s', (text, expected) => {
			expect(redactSecretsInText(text)).toBe(expected);
		});

		it('should keep a JSON line valid', () => {
			const line = JSON.stringify({ message: 'Cannot GET /sharetoken/a"b\\c', url: '/x?token=a"b' });

			const parsed = JSON.parse(redactSecretsInText(line)) as Record<string, string>;

			expect(parsed.message).not.toContain('a"b');
		});

		it.each([
			'Cannot GET /api/v3/rooms/1',
			'Cannot GET /other/sharetoken/abc',
			'see sharetoken/abc',
			'/rooms?page=2&limit=10',
			'a & b=c',
		])('should not change %s', (text) => {
			expect(redactSecretsInText(text)).toBe(text);
		});
	});

	describe('redactSecretsInText with adversarial input', () => {
		const length = 200_000;
		const fill = (unit: string): string => unit.repeat(Math.ceil(length / unit.length)).slice(0, length);

		it.each([
			['+a runs', `/${fill('+a')}`],
			['slash runs', fill('/')],
			['a runs', fill('a')],
			['repeated ://', fill('://')],
			['repeated ?a=', fill('?a=')],
			['scheme with a long host', `a://${fill('b')}`],
			['repeated scheme and host', fill('a://b')],
			['encoded brackets', fill('?a%5B')],
			['json escapes and slashes', fill('\\n/')],
			['mount prefix with slash runs', `/api/v3${fill('/')}`],
			['repeated prefix', fill('/sharetoken/')],
		])('should handle 200 KB of %s in linear time', (_name, text) => {
			const start = performance.now();

			redactSecretsInText(text);

			expect(performance.now() - start).toBeLessThan(50);
		});
	});
});
