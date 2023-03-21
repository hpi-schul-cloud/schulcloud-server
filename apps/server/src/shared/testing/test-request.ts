import { INestApplication } from '@nestjs/common';
import { Account } from '@shared/domain';
import supertest from 'supertest';
import { defaultTestPassword } from './factory/account.factory';

interface AuthenticationResponse {
	accessToken: string;
}

enum Header {
	accept = 'accept',
	json = 'application/json',
	authorization = 'authorization',
}

enum Jwt {
	invalid = 'invalidJwt',
	prefix = 'Bearer',
	loginUri = '/authentication/local',
	responseKey = 'accessToken',
	errorMessage = 'TestRequest: Can not cast to local AutenticationResponse:',
}

export class TestRequest {
	app: INestApplication;

	baseRoute: string;

	// , private readonly jwtService: JwtService
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
		if (Jwt.responseKey in response.body) {
			authenticationResponse = response.body as AuthenticationResponse;
		} else {
			const body = JSON.stringify(response.body);
			throw new Error(`${Jwt.errorMessage} ${body}`);
		}

		return authenticationResponse;
	}

	private getFormatedJwt(response: supertest.Response): string {
		const authenticationResponse = this.castToAuthenticationResponse(response);
		const jwt = authenticationResponse.accessToken;
		const formatedJwt = `${Jwt.prefix} ${jwt}`;

		return formatedJwt;
	}

	public async getJwt(accountWithPassword?: Account): Promise<string> {
		let formatedJwt: string = Jwt.invalid;

		if (accountWithPassword) {
			const uri = Jwt.loginUri;
			const params = {
				username: accountWithPassword.username,
				password: defaultTestPassword,
			};
			const response = await supertest(this.app.getHttpServer()).post(uri).set(Header.accept, Header.json).send(params);

			formatedJwt = this.getFormatedJwt(response);
		}

		return formatedJwt;
	}

	public async get(
		routeName: string,
		account?: Account,
		query?: string | Record<string, unknown>
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const response = await supertest(this.app.getHttpServer())
			.get(uri)
			.set(Header.accept, Header.json)
			.set(Header.authorization, formatedJwt)
			.query(query || {});

		return response;
	}

	public async delete(
		routeName: string,
		account?: Account,
		query?: string | Record<string, unknown>
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const response = await supertest(this.app.getHttpServer())
			.delete(uri)
			.set(Header.accept, Header.json)
			.set(Header.authorization, formatedJwt)
			.query(query || {});

		return response;
	}

	public async update(
		routeName: string,
		data = {},
		account?: Account,
		query?: string | Record<string, unknown>
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const response = await supertest(this.app.getHttpServer())
			.put(uri)
			.set(Header.accept, Header.json)
			.set(Header.authorization, formatedJwt)
			.query(query || {})
			.send(data);

		return response;
	}

	public async post(
		routeName: string,
		data = {},
		account?: Account,
		query?: string | Record<string, unknown>
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		const formatedJwt = await this.getJwt(account);
		const response = await supertest(this.app.getHttpServer())
			.post(uri)
			.set(Header.accept, Header.json)
			.set(Header.authorization, formatedJwt)
			.query(query || {})
			.send(data);

		return response;
	}
}
