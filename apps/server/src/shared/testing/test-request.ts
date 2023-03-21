import { INestApplication } from '@nestjs/common';
import { Account } from '@shared/domain';
import { ICurrentUser } from '@src/modules';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { defaultTestPassword } from './factory/account.factory';

interface AuthenticationResponse {
	accessToken: string;
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
		if ('accessToken' in response.body) {
			authenticationResponse = response.body as AuthenticationResponse;
		} else {
			const body = JSON.stringify(response.body);
			throw new Error(`TestRequest: Can not cast to local AutenticationResponse: ${body}`);
		}

		return authenticationResponse;
	}

	private getFormatedJwt(response: supertest.Response): string {
		const authenticationResponse = this.castToAuthenticationResponse(response);
		const jwt = authenticationResponse.accessToken;
		const formatedJwt = `Bearer ${jwt}`;

		return formatedJwt;
	}

	public async getJwt(accountWithPassword?: Account): Promise<string> {
		let formatedJwt = 'invalidJwt';

		if (accountWithPassword) {
			const uri = '/authentication/local';
			const params = {
				username: accountWithPassword.username,
				password: defaultTestPassword,
			};
			const response = await supertest(this.app.getHttpServer())
				.post(uri)
				.set('Accept', 'application/json')
				.send(params);

			formatedJwt = this.getFormatedJwt(response);
		}

		return formatedJwt;
	}
	/*
	public generateJwt(currentUser: ICurrentUser) {
		const jti = randomUUID();

		const jwt = this.jwtService.sign(currentUser, {
			subject: currentUser.accountId,
			jwtid: jti,
		});

		return jwt;
	}
	*/

	public async get(
		routeName: string,
		account?: Account,
		query?: string | Record<string, unknown>
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		// const jwt = this.generateJwt(account);
		const formatedJwt = await this.getJwt(account);
		const response = await supertest(this.app)
			.get(uri)
			.set('Accept', 'application/json')
			.set('Authorization', formatedJwt)
			.query(query || {});

		return response;
	}

	public async post(
		routeName: string,
		data = {},
		account?: Account,
		query?: string | Record<string, unknown>
	): Promise<supertest.Response> {
		const uri = this.getUri(routeName);
		// const jwt = this.generateJwt(account);
		const formatedJwt = await this.getJwt(account);
		const response = await supertest(this.app.getHttpServer())
			.post(uri)
			.set('accept', 'application/json')
			.set('authorization', formatedJwt)
			.query(query || {})
			.send(data);

		return response;
	}
}
