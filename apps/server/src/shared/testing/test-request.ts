import { INestApplication } from '@nestjs/common';
import { Account } from '@shared/domain';
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
	invalid: 'invalidJwt',
	prefix: 'Bearer',
	loginPath: '/authentication/local',
	accessToken: 'accessToken',
	errorMessage: 'TestRequest: Can not cast to local AutenticationResponse:',
};

/**
 * Note res.cookie is not supported atm, feel free to add this
 */
export class TestRequest {
	private readonly app: INestApplication;

	private readonly baseRoute: string;

	constructor(app: INestApplication, baseRoute: string) {
		this.app = app;
		this.baseRoute = this.checkAndAddPrefix(baseRoute);
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

	private getFormatedJwt(response: Response): string {
		if (!this.isAuthenticationResponse(response.body)) {
			const body = JSON.stringify(response.body);
			throw new Error(`${testReqestConst.errorMessage} ${body}`);
		}

		const authenticationResponse = response.body;
		const jwt = authenticationResponse.accessToken;
		const formatedJwt = `${testReqestConst.prefix} ${jwt}`;

		return formatedJwt;
	}

	public async getJwt(accountWithPassword?: Account): Promise<string> {
		let formatedJwt: string = testReqestConst.invalid;

		if (accountWithPassword) {
			const path = testReqestConst.loginPath;
			const params: { username: string; password: string } = {
				username: accountWithPassword.username,
				password: defaultTestPassword,
			};
			const response = await supertest(this.app.getHttpServer())
				.post(path)
				.set(headerConst.accept, headerConst.json)
				.send(params);

			formatedJwt = this.getFormatedJwt(response);
		}

		return formatedJwt;
	}

	private getHeader(formatedJwt: string, additionalHeader: Record<string, string> = {}) {
		const baseHeader = {
			authorization: formatedJwt,
			accept: headerConst.json,
		};
		const header = Object.assign(baseHeader, additionalHeader);

		return header;
	}

	public async get(
		subPath?: string,
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Test> {
		const path = this.getPath(subPath);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const testRequestInstance = supertest(this.app.getHttpServer()).get(path).set(header).query(query);

		return testRequestInstance;
	}

	public async delete(
		subPath?: string,
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Test> {
		const path = this.getPath(subPath);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const testRequestInstance = supertest(this.app.getHttpServer()).delete(path).set(header).query(query);

		return testRequestInstance;
	}

	public async put(
		subPath?: string,
		data = {},
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Test> {
		const path = this.getPath(subPath);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const testRequestInstance = supertest(this.app.getHttpServer()).put(path).set(header).query(query).send(data);

		return testRequestInstance;
	}

	public async patch(
		subPath?: string,
		data = {},
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Test> {
		const path = this.getPath(subPath);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const testRequestInstance = supertest(this.app.getHttpServer()).patch(path).set(header).query(query).send(data);

		return testRequestInstance;
	}

	public async post(
		subPath?: string,
		data = {},
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Test> {
		const path = this.getPath(subPath);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const testRequestInstance = supertest(this.app.getHttpServer()).post(path).set(header).query(query).send(data);

		return testRequestInstance;
	}
}
