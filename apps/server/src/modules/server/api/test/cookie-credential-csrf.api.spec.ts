import { ServerTestModule } from '@modules/server';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Server } from 'node:http';
import supertest from 'supertest';
import { COOKIE_CREDENTIAL_CSRF_MESSAGE } from '../../middleware/cookie-credential-csrf.middleware';

const unsafeMethods = ['post', 'put', 'patch', 'delete'] as const;
const deniedSites = ['cross-site', 'same-site'] as const;

/**
 * Generated API check against the module the other API tests boot.
 * Each unsafe method and blocked fetch site is produced from the lists above.
 */
describe('cookie credential CSRF (API)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('generated cookie requests', () => {
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
					[method]('/')
					.set('Cookie', 'jwt=token')
					.set('Sec-Fetch-Site', fetchSite)
					.send({});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual(expect.objectContaining({ message: COOKIE_CREDENTIAL_CSRF_MESSAGE }));
			});

			it.each(['same-origin', 'none'])('does not block cookie POST for Sec-Fetch-Site %s', async (fetchSite) => {
				const response = await supertest(app.getHttpServer() as Server)
					.post('/')
					.set('Cookie', 'jwt=token')
					.set('Sec-Fetch-Site', fetchSite)
					.send({});

				expect(response.status).not.toBe(HttpStatus.FORBIDDEN);
			});

			it('does not block a cross-site bearer POST', async () => {
				const response = await supertest(app.getHttpServer() as Server)
					.post('/')
					.set('Authorization', 'Bearer token')
					.set('Sec-Fetch-Site', 'cross-site')
					.send({});

				expect(response.status).not.toBe(HttpStatus.FORBIDDEN);
			});

			it('does not block an ordinary cookie GET', async () => {
				const response = await supertest(app.getHttpServer() as Server)
					.get('/config/public')
					.set('Cookie', 'jwt=token')
					.set('Sec-Fetch-Site', 'cross-site');

				expect(response.status).not.toBe(HttpStatus.FORBIDDEN);
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
			});

			it.each(protectedReads)('does not block a same-origin cookie $method of $path', async ({ method, path }) => {
				const response = await supertest(app.getHttpServer() as Server)
					[method](path)
					.set('Cookie', 'jwt=token')
					.set('Sec-Fetch-Site', 'same-origin');

				expect(response.status).not.toBe(HttpStatus.FORBIDDEN);
			});
		});
	});
});
