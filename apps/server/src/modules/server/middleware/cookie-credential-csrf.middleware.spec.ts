import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import {
	Controller,
	ForbiddenException,
	Get,
	HttpStatus,
	type INestApplication,
	type MiddlewareConsumer,
	Module,
	type NestModule,
	Post,
	RequestMethod,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type NextFunction, type Request, type Response } from 'express';
import { type Server } from 'node:http';
import supertest from 'supertest';
import { ServerModule, ServerTestModule } from '../server.app.module';
import {
	COOKIE_CREDENTIAL_CSRF_MESSAGE,
	configureCookieCredentialCsrf,
	cookieCredentialCsrfMiddleware,
	CookieCredentialCsrfMiddleware,
} from './cookie-credential-csrf.middleware';
import { cookieCredentialCsrfMiddleware as exportedCookieCredentialCsrfMiddleware } from '../index';

interface RequestOptions {
	method: string;
	path?: string;
	protocol?: string;
	headers?: Record<string, string>;
}

let createCalls = 0;
let protectedGetCalls = 0;

@Controller('items')
class ItemsController {
	@Post()
	public create(): { ok: boolean } {
		createCalls += 1;

		return { ok: true };
	}

	@Get()
	public find(): { ok: boolean } {
		return { ok: true };
	}
}

@Controller()
class ProtectedGetController {
	@Get('collaborative-text-editor/:parentType/:parentId')
	public openEditor(): { ok: boolean } {
		protectedGetCalls += 1;

		return { ok: true };
	}

	@Get('tools/context/:contextExternalToolId/launch')
	public launch(): { ok: boolean } {
		protectedGetCalls += 1;

		return { ok: true };
	}
}

@Module({ controllers: [ItemsController, ProtectedGetController] })
class ModuleConfiguredApp implements NestModule {
	public configure(consumer: MiddlewareConsumer): void {
		configureCookieCredentialCsrf(consumer);
	}
}

@Module({ controllers: [ItemsController, ProtectedGetController] })
class ExpressConfiguredApp {}

describe('server module barrel', () => {
	it('exports the cookie CSRF middleware', () => {
		expect(exportedCookieCredentialCsrfMiddleware).toBe(cookieCredentialCsrfMiddleware);
	});
});

describe('cookieCredentialCsrfMiddleware', () => {
	const next = jest.fn() as jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		next.mockClear();
	});

	const allow = (request: Request): void => {
		cookieCredentialCsrfMiddleware(request, createMock<Response>(), next);

		expect(next).toHaveBeenCalledTimes(1);
	};

	const deny = (request: Request): void => {
		expect(() => cookieCredentialCsrfMiddleware(request, createMock<Response>(), next)).toThrow(ForbiddenException);
		expect(next).not.toHaveBeenCalled();
	};

	describe('when the request is not authenticated with the jwt cookie', () => {
		it('allows a cross-site bearer request', () => {
			allow(
				createRequest({
					method: 'POST',
					headers: {
						authorization: 'Bearer token',
						'sec-fetch-site': 'cross-site',
					},
				})
			);
		});

		it('allows a bearer request that also sends the jwt cookie', () => {
			allow(
				createRequest({
					method: 'POST',
					headers: {
						authorization: 'Bearer token',
						cookie: 'jwt=token',
						'sec-fetch-site': 'cross-site',
					},
				})
			);
		});

		it('allows a request with a different cookie', () => {
			allow(
				createRequest({
					method: 'POST',
					headers: { cookie: 'sid=token', 'sec-fetch-site': 'cross-site' },
				})
			);
		});

		it('allows an empty jwt cookie', () => {
			allow(createRequest({ method: 'POST', headers: { cookie: 'jwt=' } }));
		});
	});

	describe('when the request is cookie-credentialed', () => {
		const cookie = 'jwt=token';

		describe('when sec-fetch-site is present', () => {
			const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;
			const deniedSites = ['cross-site', 'same-site'] as const;
			const allowedSites = ['same-origin', 'none'] as const;
			const denied = unsafeMethods.flatMap((method) =>
				deniedSites.map((fetchSite) => {
					return { method, fetchSite };
				})
			);

			it.each(denied)('denies cookie $method for Sec-Fetch-Site $fetchSite', ({ method, fetchSite }) => {
				deny(createRequest({ method, headers: { cookie, 'sec-fetch-site': fetchSite } }));
			});

			it.each(allowedSites)('allows POST for Sec-Fetch-Site %s', (fetchSite) => {
				allow(createRequest({ method: 'POST', headers: { cookie, 'sec-fetch-site': fetchSite } }));
			});

			it('denies an unexpected Sec-Fetch-Site value', () => {
				deny(createRequest({ method: 'POST', headers: { cookie, 'sec-fetch-site': 'unknown' } }));
			});

			it('still checks a non-bearer authorization scheme', () => {
				deny(
					createRequest({
						method: 'POST',
						headers: { cookie, authorization: 'Basic abc', 'sec-fetch-site': 'cross-site' },
					})
				);
			});

			const readMethods = ['GET', 'HEAD'] as const;
			const protectedPaths = [
				'/collaborative-text-editor/course/parent-1',
				'/collaborative-text-editor/course/parent-1/',
				'/api/v3/collaborative-text-editor/course/parent-1',
				'/tools/context/tool-1/launch',
				'/api/v3/tools/context/tool-1/launch/',
				'/COLLABORATIVE-TEXT-EDITOR/course/parent-1',
				'/api/v3/Tools/Context/tool-1/Launch',
				'/API/V3/collaborative-text-editor/course/parent-1',
				'/TOOLS/CONTEXT/tool-1/LAUNCH',
			];
			const protectedReads = readMethods.flatMap((method) =>
				protectedPaths.flatMap((path) =>
					deniedSites.map((fetchSite) => {
						return { method, path, fetchSite };
					})
				)
			);
			const trustedReads = readMethods.flatMap((method) =>
				protectedPaths.flatMap((path) =>
					allowedSites.map((fetchSite) => {
						return { method, path, fetchSite };
					})
				)
			);
			const openReads = [
				{ method: 'GET', path: '/tools/context/tool-1/launch/extra' },
				{ method: 'HEAD', path: '/pseudonyms/username/opaque' },
				{ method: 'OPTIONS', path: '/items' },
			];

			it.each(protectedReads)('denies $method $path for Sec-Fetch-Site $fetchSite', ({ method, path, fetchSite }) => {
				deny(createRequest({ method, path, headers: { cookie, 'sec-fetch-site': fetchSite } }));
			});

			it.each(trustedReads)('allows $method $path for Sec-Fetch-Site $fetchSite', ({ method, path, fetchSite }) => {
				allow(createRequest({ method, path, headers: { cookie, 'sec-fetch-site': fetchSite } }));
			});

			it.each(openReads)('allows $method $path for Sec-Fetch-Site cross-site', ({ method, path }) => {
				allow(createRequest({ method, path, headers: { cookie, 'sec-fetch-site': 'cross-site' } }));
			});
		});

		describe('when sec-fetch-site is absent', () => {
			describe('Origin', () => {
				it('allows an Origin with the same scheme and host', () => {
					allow(
						createRequest({
							method: 'POST',
							headers: { cookie, host: 'app.example', origin: 'https://app.example' },
						})
					);
				});

				it('denies a foreign Origin', () => {
					deny(
						createRequest({
							method: 'POST',
							headers: { cookie, host: 'app.example', origin: 'https://evil.example' },
						})
					);
				});

				it('rejects a matching Referer for a foreign Origin', () => {
					deny(
						createRequest({
							method: 'POST',
							headers: {
								cookie,
								host: 'app.example',
								origin: 'https://evil.example',
								referer: 'https://app.example/board',
							},
						})
					);
				});

				it('denies an opaque or unparseable Origin', () => {
					deny(createRequest({ method: 'POST', headers: { cookie, host: 'app.example', origin: 'null' } }));
				});

				it('treats default ports as the same host', () => {
					allow(
						createRequest({
							method: 'POST',
							headers: { cookie, host: 'app.example:443', origin: 'https://app.example' },
						})
					);
				});

				it('denies a different port or scheme', () => {
					deny(
						createRequest({
							method: 'POST',
							headers: { cookie, host: 'app.example:4444', origin: 'https://app.example' },
						})
					);
					next.mockClear();
					deny(
						createRequest({
							method: 'POST',
							protocol: 'http',
							headers: { cookie, host: 'app.example', origin: 'https://app.example' },
						})
					);
				});

				it('denies a request with a missing host', () => {
					deny(createRequest({ method: 'POST', headers: { cookie, origin: 'https://app.example' } }));
				});
			});

			describe('Referer', () => {
				it('allows a Referer with the same scheme and host', () => {
					allow(
						createRequest({
							method: 'POST',
							headers: { cookie, host: 'app.example', referer: 'https://app.example/board?tab=1' },
						})
					);
				});

				it('denies a foreign Referer', () => {
					deny(
						createRequest({
							method: 'POST',
							headers: { cookie, host: 'app.example', referer: 'https://evil.example/board' },
						})
					);
				});

				it('accepts the referrer header spelling', () => {
					allow(
						createRequest({
							method: 'POST',
							headers: { cookie, host: 'app.example', referrer: 'https://app.example/board' },
						})
					);
				});
			});

			it('denies a request with neither Origin nor Referer', () => {
				deny(createRequest({ method: 'POST', headers: { cookie, host: 'app.example' } }));
			});

			it('allows an ordinary cookie GET', () => {
				allow(createRequest({ method: 'GET', path: '/pseudonyms/username/opaque', headers: { cookie } }));
			});

			it('allows a cookie GET for the root path', () => {
				allow(createRequest({ method: 'GET', path: '/', headers: { cookie } }));
			});
		});
	});
});

describe('configureCookieCredentialCsrf', () => {
	it('registers the middleware on every route of the modules API tests and production use', () => {
		for (const ModuleClass of [ServerModule, ServerTestModule]) {
			const forRoutes = jest.fn();
			const apply = jest.fn().mockReturnValue({ forRoutes });
			const consumer = createMock<MiddlewareConsumer>({ apply });

			new ModuleClass().configure(consumer);

			expect(apply).toHaveBeenCalledWith(CookieCredentialCsrfMiddleware);
			expect(forRoutes).toHaveBeenCalledWith({ path: '{*splat}', method: RequestMethod.ALL });
		}
	});
});

describe('CookieCredentialCsrfMiddleware on a Nest app', () => {
	describe('when the server module registers it', () => {
		let app: INestApplication;

		beforeAll(async () => {
			const moduleRef = await Test.createTestingModule({ imports: [ModuleConfiguredApp] }).compile();
			app = moduleRef.createNestApplication();
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(() => {
			createCalls = 0;
			protectedGetCalls = 0;
		});

		describe('generated request matrix', () => {
			const unsafeMethods = ['post', 'put', 'patch', 'delete'] as const;
			const deniedSites = ['cross-site', 'same-site'] as const;
			const denied = unsafeMethods.flatMap((method) =>
				deniedSites.map((fetchSite) => {
					return { method, fetchSite };
				})
			);
			const protectedPaths = [
				'/collaborative-text-editor/course/parent-1',
				'/COLLABORATIVE-TEXT-EDITOR/course/parent-1',
				'/tools/context/tool-1/launch',
			];
			const protectedReads = (['get', 'head'] as const).flatMap((method) =>
				protectedPaths.map((path) => {
					return { method, path };
				})
			);

			describe('Sec-Fetch-Site', () => {
				it.each(denied)('denies cookie $method for Sec-Fetch-Site $fetchSite', async ({ method, fetchSite }) => {
					const response = await supertest(app.getHttpServer() as Server)
						[method]('/items')
						.set('Cookie', 'jwt=token')
						.set('Sec-Fetch-Site', fetchSite)
						.send({});

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual(expect.objectContaining({ message: COOKIE_CREDENTIAL_CSRF_MESSAGE }));
					expect(createCalls).toBe(0);
				});

				it.each(['same-origin', 'none'])('allows cookie POST for Sec-Fetch-Site %s', async (fetchSite) => {
					const response = await supertest(app.getHttpServer() as Server)
						.post('/items')
						.set('Cookie', 'jwt=token')
						.set('Sec-Fetch-Site', fetchSite)
						.send({});

					expect(response.status).toBe(HttpStatus.CREATED);
					expect(createCalls).toBe(1);
				});

				it('allows a cross-site bearer POST', async () => {
					const response = await supertest(app.getHttpServer() as Server)
						.post('/items')
						.set('Authorization', 'Bearer token')
						.set('Sec-Fetch-Site', 'cross-site')
						.send({});

					expect(response.status).toBe(HttpStatus.CREATED);
					expect(createCalls).toBe(1);
				});

				it('allows an ordinary cookie GET', async () => {
					const response = await supertest(app.getHttpServer() as Server)
						.get('/items')
						.set('Cookie', 'jwt=token')
						.set('Sec-Fetch-Site', 'cross-site');

					expect(response.status).toBe(HttpStatus.OK);
					expect(createCalls).toBe(0);
				});

				it.each(protectedReads)('denies a cross-site cookie $method of $path', async ({ method, path }) => {
					const response = await supertest(app.getHttpServer() as Server)
						[method](path)
						.set('Cookie', 'jwt=token')
						.set('Sec-Fetch-Site', 'cross-site');

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
					if (method !== 'head') {
						expect(response.body).toEqual(expect.objectContaining({ message: COOKIE_CREDENTIAL_CSRF_MESSAGE }));
					}
					expect(protectedGetCalls).toBe(0);
				});

				it.each(protectedReads)('allows a same-origin cookie $method of $path', async ({ method, path }) => {
					const response = await supertest(app.getHttpServer() as Server)
						[method](path)
						.set('Cookie', 'jwt=token')
						.set('Sec-Fetch-Site', 'same-origin');

					expect(response.status).toBe(HttpStatus.OK);
					expect(protectedGetCalls).toBe(1);
				});
			});
		});
	});

	describe('when the bootstrap registers it with nestApp.use', () => {
		let app: INestApplication;

		beforeAll(async () => {
			const moduleRef = await Test.createTestingModule({ imports: [ExpressConfiguredApp] }).compile();
			app = moduleRef.createNestApplication();
			app.use(cookieCredentialCsrfMiddleware);
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(() => {
			createCalls = 0;
		});

		it('returns ForbiddenException from the exception filter and does not call the handler', async () => {
			const response = await supertest(app.getHttpServer() as Server)
				.post('/items')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'same-site')
				.send({});

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
			expect(response.body).toEqual(expect.objectContaining({ message: COOKIE_CREDENTIAL_CSRF_MESSAGE }));
			expect(createCalls).toBe(0);
		});
	});
});

function createRequest(options: RequestOptions): Request {
	const headers = Object.fromEntries(
		Object.entries(options.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value])
	);
	const request: DeepMocked<Request> = createMock<Request>({
		method: options.method,
		path: options.path ?? '/items',
		protocol: options.protocol ?? 'https',
		headers,
	});
	request.get.mockImplementation((name: string) => headers[name.toLowerCase()]);

	return request;
}
