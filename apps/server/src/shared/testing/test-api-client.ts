import { INestApplication } from '@nestjs/common';
import { Account } from '@shared/domain/entity';
import supertest, { Response } from 'supertest';
import { defaultTestPassword } from './factory/account.factory';

interface AuthenticationResponse {
	accessToken: string;
}

const headerConst = {
	accept: 'accept',
	json: 'application/json',
};

const testReqestConst = {
	prefix: 'Bearer',
	loginPath: '/authentication/local',
	accessToken: 'accessToken',
	errorMessage: 'TestApiClient: Can not cast to local AutenticationResponse:',
};

/**
 * Note res.cookie is not supported atm, feel free to add this
 */
export class TestApiClient {
	private readonly app: INestApplication;

	private readonly baseRoute: string;

	private readonly formattedJwt: string;

	constructor(app: INestApplication, baseRoute: string, jwt?: string) {
		this.app = app;
		this.baseRoute = this.checkAndAddPrefix(baseRoute);
		this.formattedJwt = `${testReqestConst.prefix} ${jwt || ''}`;
	}

	public get(subPath?: string): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer()).get(path).set('authorization', this.formattedJwt);

		return testRequestInstance;
	}

	public delete(subPath?: string): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.delete(path)
			.set('authorization', this.formattedJwt);

		return testRequestInstance;
	}

	public put<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.put(path)
			.set('authorization', this.formattedJwt)
			.send(data);

		return testRequestInstance;
	}

	public patch<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.patch(path)
			.set('authorization', this.formattedJwt)
			.send(data);

		return testRequestInstance;
	}

	public post<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.post(path)
			.set('authorization', this.formattedJwt)
			.send(data);

		return testRequestInstance;
	}

	public postWithAttachment(
		subPath: string | undefined,
		fieldName: string,
		data: Buffer,
		fileName: string
	): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.post(path)
			.set('authorization', this.formattedJwt)
			.attach(fieldName, data, fileName);

		return testRequestInstance;
	}

	public async login(account: Account): Promise<this> {
		const path = testReqestConst.loginPath;
		const params: { username: string; password: string } = {
			username: account.username,
			password: defaultTestPassword,
		};
		const response = await supertest(this.app.getHttpServer())
			.post(path)
			.set(headerConst.accept, headerConst.json)
			.send(params);

		const jwtFromResponse = this.getJwtFromResponse(response);

		return new (this.constructor as new (app: INestApplication, baseRoute: string, jwt?: string) => this)(
			this.app,
			this.baseRoute,
			jwtFromResponse
		);
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

	private isAuthenticationResponse(body: unknown): body is AuthenticationResponse {
		const isAuthenticationResponse = typeof body === 'object' && body !== null && testReqestConst.accessToken in body;

		return isAuthenticationResponse;
	}

	private getJwtFromResponse(response: Response): string {
		if (response.error) {
			const error = JSON.stringify(response.error);
			throw new Error(error);
		}
		if (!this.isAuthenticationResponse(response.body)) {
			const body = JSON.stringify(response.body);
			throw new Error(`${testReqestConst.errorMessage} ${body}`);
		}
		const authenticationResponse = response.body;
		const jwt = authenticationResponse.accessToken;

		return jwt;
	}
}
