import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export class E2eTestApi<T> {
	app: INestApplication;

	routeName: string;

	constructor(app: INestApplication, routeName: string) {
		this.app = app;
		this.routeName = routeName;
	}

	async get(query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(this.routeName)
			.set('Accept', 'application/json')
			.query(query || {});

		return {
			result: response.body as T,
			status: response.status,
		};
	}
}
