import { INestApplication } from '@nestjs/common';
import { Account } from '@shared/domain';
import supertest from 'supertest';
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
	loginUri: '/authentication/local',
	responseKey: 'accessToken',
	errorMessage: 'TestRequest: Can not cast to local AutenticationResponse:',
};

export class TestRequest {
	app: INestApplication;

	baseRoute: string;

	constructor(app: INestApplication, baseRoute: string) {
		this.app = app;
		this.baseRoute = this.checkAndAddPrefix(baseRoute);
	}

	private checkAndAddPrefix(uriInput = '/'): string {
		let uri = '';
		if (uriInput.charAt(0) !== '/') {
			uri = '/';
		}
		uri += uriInput;

		return uri;
	}

	private getUri(routeNameInput: string): string {
		const routeName = this.checkAndAddPrefix(routeNameInput);
		const uri = this.baseRoute + routeName;

		return uri;
	}

	private castToAuthenticationResponse(response: supertest.Response): AuthenticationResponse {
		let authenticationResponse: AuthenticationResponse;
		if (testReqestConst.responseKey in response.body) {
			authenticationResponse = response.body as AuthenticationResponse;
		} else {
			const body = JSON.stringify(response.body);
			throw new Error(`${testReqestConst.errorMessage} ${body}`);
		}

		return authenticationResponse;
	}

	private getFormatedJwt(response: supertest.Response): string {
		const authenticationResponse = this.castToAuthenticationResponse(response);
		const jwt = authenticationResponse.accessToken;
		const formatedJwt = `${testReqestConst.prefix} ${jwt}`;

		return formatedJwt;
	}

	public async getJwt(accountWithPassword?: Account): Promise<string> {
		let formatedJwt: string = testReqestConst.invalid;

		if (accountWithPassword) {
			const uri = testReqestConst.loginUri;
			const params: { username: string; password: string } = {
				username: accountWithPassword.username,
				password: defaultTestPassword,
			};
			const response = await supertest(this.app.getHttpServer())
				.post(uri)
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
		routeName: string,
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const response = await supertest(this.app.getHttpServer()).get(uri).set(header).query(query);

		return response;
	}

	public async delete(
		routeName: string,
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const response = await supertest(this.app.getHttpServer()).delete(uri).set(header).query(query);

		return response;
	}

	public async update(
		routeName: string,
		data = {},
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const response = await supertest(this.app.getHttpServer()).put(uri).set(header).query(query).send(data);

		return response;
	}

	public async post(
		routeName: string,
		data = {},
		account?: Account,
		query: string | Record<string, string> = {},
		additionalHeader: Record<string, string> = {}
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const header = this.getHeader(formatedJwt, additionalHeader);
		const response = await supertest(this.app.getHttpServer()).post(uri).set(header).query(query).send(data);

		return response;
	}
}
