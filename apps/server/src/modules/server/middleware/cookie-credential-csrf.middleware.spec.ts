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
		it('allows a bearer request even when Sec-Fetch-Site is cross-site', () => {
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

		it('denies cross-site and same-site unsafe methods', () => {
			for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
				deny(createRequest({ method, headers: { cookie, 'sec-fetch-site': 'cross-site' } }));
				next.mockClear();
				deny(createRequest({ method, headers: { cookie, 'sec-fetch-site': 'same-site' } }));
				next.mockClear();
			}
		});

		it('allows same-origin and user-agent initiated unsafe methods', () => {
			allow(createRequest({ method: 'POST', headers: { cookie, 'sec-fetch-site': 'same-origin' } }));
			next.mockClear();
			allow(createRequest({ method: 'POST', headers: { cookie, 'sec-fetch-site': 'none' } }));
		});

		it('denies an unexpected Sec-Fetch-Site value', () => {
			deny(createRequest({ method: 'POST', headers: { cookie, 'sec-fetch-site': 'unknown' } }));
		});

		it('falls back to Origin when Sec-Fetch-Site is absent', () => {
			allow(
				createRequest({
					method: 'POST',
					headers: { cookie, host: 'app.example', origin: 'https://app.example' },
				})
			);
			next.mockClear();
			deny(
				createRequest({
					method: 'POST',
					headers: { cookie, host: 'app.example', origin: 'https://evil.example' },
				})
			);
		});

		it('does not accept a matching Referer when Origin is foreign', () => {
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

		it('uses Referer when Origin is absent', () => {
			allow(
				createRequest({
					method: 'POST',
					headers: { cookie, host: 'app.example', referer: 'https://app.example/board?tab=1' },
				})
			);
			next.mockClear();
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

		it('denies a request with neither Origin nor Referer', () => {
			deny(createRequest({ method: 'POST', headers: { cookie, host: 'app.example' } }));
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

		it('denies when the request host is missing', () => {
			deny(createRequest({ method: 'POST', headers: { cookie, origin: 'https://app.example' } }));
		});

		it('allows an ordinary cookie GET', () => {
			allow(createRequest({ method: 'GET', path: '/pseudonyms/username/opaque', headers: { cookie } }));
		});

		it('ignores safe methods other than the listed GETs and their HEAD', () => {
			allow(
				createRequest({
					method: 'HEAD',
					path: '/pseudonyms/username/opaque',
					headers: { cookie, 'sec-fetch-site': 'cross-site' },
				})
			);
			next.mockClear();
			allow(createRequest({ method: 'OPTIONS', headers: { cookie, 'sec-fetch-site': 'cross-site' } }));
		});

		it.each([
			['/collaborative-text-editor/course/parent-1', 'cross-site', false],
			['/collaborative-text-editor/course/parent-1/', 'same-origin', true],
			['/api/v3/collaborative-text-editor/course/parent-1', 'cross-site', false],
			['/tools/context/tool-1/launch', 'cross-site', false],
			['/tools/context/tool-1/launch', 'same-origin', true],
			['/api/v3/tools/context/tool-1/launch/', 'none', true],
			['/tools/context/tool-1/launch/extra', 'cross-site', true],
			['/COLLABORATIVE-TEXT-EDITOR/course/parent-1', 'cross-site', false],
			['/api/v3/Tools/Context/tool-1/Launch', 'cross-site', false],
			['/API/V3/collaborative-text-editor/course/parent-1', 'same-origin', true],
		])('protects state-changing GET %s when Sec-Fetch-Site is %s (allowed=%s)', (path, fetchSite, allowed) => {
			const request = createRequest({
				method: 'GET',
				path,
				headers: { cookie, 'sec-fetch-site': fetchSite },
			});

			if (allowed) {
				allow(request);
				return;
			}

			deny(request);
		});

		it.each([
			['/collaborative-text-editor/course/parent-1', 'cross-site', false],
			['/collaborative-text-editor/course/parent-1', 'same-origin', true],
			['/TOOLS/CONTEXT/tool-1/LAUNCH', 'cross-site', false],
			['/tools/context/tool-1/launch', 'same-origin', true],
			['/pseudonyms/username/opaque', 'cross-site', true],
		])('protects HEAD %s when Sec-Fetch-Site is %s (allowed=%s)', (path, fetchSite, allowed) => {
			const request = createRequest({
				method: 'HEAD',
				path,
				headers: { cookie, 'sec-fetch-site': fetchSite },
			});

			if (allowed) {
				allow(request);
				return;
			}

			deny(request);
		});

		it('still checks a non-bearer authorization scheme', () => {
			deny(
				createRequest({
					method: 'POST',
					headers: { cookie, authorization: 'Basic abc', 'sec-fetch-site': 'cross-site' },
				})
			);
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

		it('denies a cross-site cookie POST before the handler runs', async () => {
			const response = await supertest(app.getHttpServer() as Server)
				.post('/items')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'cross-site')
				.send({ name: 'board' });

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
			expect(response.body).toEqual(expect.objectContaining({ message: COOKIE_CREDENTIAL_CSRF_MESSAGE }));
			expect(createCalls).toBe(0);
		});

		it('denies a same-site cookie POST', async () => {
			const response = await supertest(app.getHttpServer() as Server)
				.post('/items')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'same-site');

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
			expect(createCalls).toBe(0);
		});

		it('allows a same-origin cookie POST', async () => {
			const response = await supertest(app.getHttpServer() as Server)
				.post('/items')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'same-origin')
				.send({});

			expect(response.status).toBe(HttpStatus.CREATED);
			expect(createCalls).toBe(1);
		});

		it('allows a bearer POST when Sec-Fetch-Site is cross-site', async () => {
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
		});

		it('denies a cross-site collaborative-text-editor GET and allows a same-origin one', async () => {
			const denied = await supertest(app.getHttpServer() as Server)
				.get('/collaborative-text-editor/course/parent-1')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'cross-site');

			expect(denied.status).toBe(HttpStatus.FORBIDDEN);
			expect(protectedGetCalls).toBe(0);

			const allowed = await supertest(app.getHttpServer() as Server)
				.get('/collaborative-text-editor/course/parent-1')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'same-origin');

			expect(allowed.status).toBe(HttpStatus.OK);
			expect(protectedGetCalls).toBe(1);
		});

		it('denies a mixed-case cross-site GET before the handler runs', async () => {
			const response = await supertest(app.getHttpServer() as Server)
				.get('/COLLABORATIVE-TEXT-EDITOR/course/parent-1')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'cross-site');

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
			expect(protectedGetCalls).toBe(0);
		});

		it('denies a cross-site HEAD to the collaborative-text-editor route before the handler runs', async () => {
			const denied = await supertest(app.getHttpServer() as Server)
				.head('/collaborative-text-editor/course/parent-1')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'cross-site');

			expect(denied.status).toBe(HttpStatus.FORBIDDEN);
			expect(protectedGetCalls).toBe(0);

			const allowed = await supertest(app.getHttpServer() as Server)
				.head('/collaborative-text-editor/course/parent-1')
				.set('Cookie', 'jwt=token')
				.set('Sec-Fetch-Site', 'same-origin');

			expect(allowed.status).toBe(HttpStatus.OK);
			expect(protectedGetCalls).toBe(1);
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
