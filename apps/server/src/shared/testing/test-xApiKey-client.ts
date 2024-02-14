import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';

export class TestXApiKeyClient {
	private readonly app: INestApplication;

	private readonly baseRoute: string;

	private readonly API_KEY: string;

	constructor(app: INestApplication, baseRoute: string, apikey?: string) {
		this.app = app;
		this.baseRoute = this.checkAndAddPrefix(baseRoute);
		this.API_KEY = apikey || 'thisistheadminapitokeninthetestconfig';
	}

	public get(subPath?: string): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.get(path)
			.set('X-API-KEY', this.API_KEY)
			.set('Accept', 'application/json');

		return testRequestInstance;
	}

	public delete(subPath?: string): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.delete(path)
			.set('X-API-KEY', this.API_KEY)
			.set('Accept', 'application/json');

		return testRequestInstance;
	}

	public post(subPath?: string, data = {}): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.post(path)
			.set('X-API-KEY', this.API_KEY)
			.set('Accept', 'application/json')
			.send(data);

		return testRequestInstance;
	}

	private isSlash(inputPath: string, pos: number): boolean {
		const isSlash = inputPath.charAt(pos) === '/';

		return isSlash;
	}

	private checkAndAddPrefix(inputPath = '/'): string {
		let path = '';
		if (!this.isSlash(inputPath, 0)) {
			path = '/';
		}
		path += inputPath;

		return path;
	}

	private cleanupPath(inputPath: string): string {
		let path = inputPath;
		if (this.isSlash(path, 0) && this.isSlash(path, 1)) {
			path = path.slice(1);
		}

		return path;
	}

	private getPath(routeNameInput = ''): string {
		const routeName = this.checkAndAddPrefix(routeNameInput);
		const path = this.cleanupPath(this.baseRoute + routeName);

		return path;
	}
}
