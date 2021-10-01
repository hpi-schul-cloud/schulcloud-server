import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as request from 'supertest';
import { ServerModule } from '@src/server.module';
import { enableOpenApiDocs } from './swagger';

describe('swagger setup', () => {
	describe('when adding swagger to an app', () => {
		let app: INestApplication;

		beforeAll(async () => {
			app = await NestFactory.create(ServerModule);
			enableOpenApiDocs(app, 'docs');
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		it('should redirect', async () => {
			const response = await request(app.getHttpServer()).get('/docs').redirects(1);
			expect(response.text).toContain('Swagger UI');
		});

		it('should serve open api documentation at given path', async () => {
			const response = await request(app.getHttpServer()).get('/docs/');
			expect(response.text).toContain('Swagger UI');
		});

		it('should serve a json api version', async () => {
			const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(response.body.info).toEqual({
				contact: {},
				description: 'This is v3 of HPI Schul-Cloud Server. Checkout /docs for v1.',
				title: 'HPI Schul-Cloud Server API',
				// care about api changes when version changes
				version: '3.0',
			});
		});
	});
});
