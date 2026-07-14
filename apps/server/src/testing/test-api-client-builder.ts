import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { defaultTestPassword } from '@modules/account/testing/account.factory';
import { type INestApplication } from '@nestjs/common';
import type { Server } from 'node:net';
import supertest, { type Response } from 'supertest';
import { JwtAuthenticationFactory } from './factory/jwt-authentication.factory';
import { type TestJwtModuleConfig } from './test-jwt-module.config';

interface AccountForAuthentication {
	id: string;
	username: string;
}

interface UserForAuthentication {
	id: string;
	school: { id: string };
	roles: ArrayLike<{ id: string }>;
}

interface AuthenticationResponse {
	accessToken: string;
}

const HTTP_HEADERS = {
	ACCEPT: 'accept',
	APPLICATION_JSON: 'application/json',
	AUTHORIZATION: 'authorization',
	API_KEY: 'X-API-KEY',
} as const;

const ENDPOINTS = {
	LOCAL_LOGIN: '/authentication/local',
	SERVICE_ACCOUNT_LOGIN: '/authentication/local-service-account',
} as const;

const AUTH_PREFIX = 'Bearer';

/**
 * A fluent builder for creating authenticated TestApiClient instances.
 *
 * @example
 * // Simple login via /authentication/local
 * const client = await new TestApiClientBuilder(app, 'users').authenticate(account);
 *
 * @example
 * // Service account login via /authentication/local-service-account
 * const client = await new TestApiClientBuilder(app, 'users')
 *   .asServiceAccount()
 *   .authenticate(account);
 *
 * @example
 * // Direct JWT generation (bypasses login endpoint)
 * const client = await new TestApiClientBuilder(app, 'users')
 *   .withJwt(user, jwtConfig)
 *   .authenticate(account);
 *
 * @example
 * // External user with direct JWT generation
 * const client = await new TestApiClientBuilder(app, 'users')
 *   .withJwt(user, jwtConfig)
 *   .asExternalUser()
 *   .withSystemId(systemId)
 *   .authenticate(account);
 *
 * @example
 * // API Key authentication
 * const client = new TestApiClientBuilder(app, 'external-api').withApiKey('my-api-key').build();
 *
 * @example
 * // Unauthenticated request (default, for testing 401 responses)
 * const client = new TestApiClientBuilder(app, 'users').build();
 * const response = await client.get();
 */
export class TestApiClientBuilder {
	private readonly app: INestApplication<Server>;

	private readonly baseRoute: string;

	private isServiceAccount = false;

	private isExternalUser = false;

	private systemId?: string;

	private user?: UserForAuthentication;

	private jwtConfig?: TestJwtModuleConfig;

	private apiKey?: string;

	private skipWhitelist = false;

	public constructor(app: INestApplication, baseRoute: string) {
		this.app = app as INestApplication<Server>;
		this.baseRoute = this.normalizeRoute(baseRoute);
	}

	public asServiceAccount(): this {
		if (this.isExternalUser) {
			throw new Error('asServiceAccount() and asExternalUser() are mutually exclusive');
		}

		this.isServiceAccount = true;

		return this;
	}

	public asExternalUser(): this {
		if (this.isServiceAccount) {
			throw new Error('asExternalUser() and asServiceAccount() are mutually exclusive');
		}

		this.isExternalUser = true;

		return this;
	}

	public withSystemId(systemId: string): this {
		this.systemId = systemId;

		return this;
	}

	/**
	 * Sets the user and JWT configuration for direct JWT generation.
	 * Use this instead of credential-based login when you need to:
	 * - Generate a JWT directly without hitting the login endpoint
	 * - Use asExternalUser() or asServiceAccount() flags in the JWT
	 */
	public withJwt(user: UserForAuthentication, jwtConfig: TestJwtModuleConfig): this {
		if (this.apiKey) {
			throw new Error('withJwt() and withApiKey() are mutually exclusive');
		}

		this.user = user;
		this.jwtConfig = jwtConfig;

		return this;
	}

	/**
	 * Sets the API key for authentication.
	 */
	public withApiKey(apiKey: string): this {
		if (this.user || this.jwtConfig) {
			throw new Error('withApiKey() and withJwt() are mutually exclusive');
		}

		this.apiKey = apiKey;

		return this;
	}

	/**
	 * Skips adding the JWT to the whitelist.
	 * Useful for testing unauthorized/expired token scenarios.
	 * Only has effect when used with withJwt().
	 */
	public withoutWhitelist(): this {
		this.skipWhitelist = true;

		return this;
	}

	/**
	 * Builds the API client.
	 * - With API key: No account needed, returns synchronously
	 * - With credentials/JWT: Account required, returns Promise
	 *
	 * @param account - The account to authenticate with (not needed for API key auth)
	 * @returns A TestApiClient instance
	 */
	public build(): TestApiClient;
	public build(account: AccountForAuthentication): Promise<TestApiClient>;
	public build(account?: AccountForAuthentication): TestApiClient | Promise<TestApiClient> {
		if (this.apiKey) {
			return new TestApiClient(this.app, this.baseRoute, this.apiKey, true);
		}

		if (account) {
			return this.buildWithAuthentication(account);
		}

		return new TestApiClient(this.app, this.baseRoute);
	}

	private async buildWithAuthentication(account: AccountForAuthentication): Promise<TestApiClient> {
		this.validateConfiguration();

		let jwt: string;

		if (this.shouldGenerateJwt()) {
			jwt = this.generateJwt(account);

			if (!this.skipWhitelist) {
				const jwtWhitelistAdapter = this.app.get(JwtWhitelistAdapter);
				await jwtWhitelistAdapter.addToWhitelist(account.id, 'jti');
			}
		} else {
			jwt = await this.authenticateWithCredentials(account);
		}

		return new TestApiClient(this.app, this.baseRoute, jwt);
	}

	private validateConfiguration(): void {
		const usesCredentialLogin = !this.shouldGenerateJwt();

		if (this.skipWhitelist && usesCredentialLogin) {
			throw new Error('withoutWhitelist() requires withJwt() - credential-based login automatically adds to whitelist');
		}

		if (usesCredentialLogin) {
			if (this.isExternalUser) {
				// eslint-disable-next-line no-console
				console.log('Warning: asExternalUser() has no effect without withJwt() - flag is only used in JWT generation');
			}
			if (this.isServiceAccount) {
				// eslint-disable-next-line no-console
				console.log(
					'Warning: asServiceAccount() affects login endpoint but isServiceAccount flag in JWT requires withJwt()'
				);
			}
			if (this.systemId) {
				// eslint-disable-next-line no-console
				console.log(
					'Warning: withSystemId() has no effect without withJwt() - systemId is only used in JWT generation'
				);
			}
		}
	}

	private shouldGenerateJwt(): boolean {
		return this.user !== undefined && this.jwtConfig !== undefined;
	}

	private generateJwt(account: AccountForAuthentication): string {
		if (!this.user || !this.jwtConfig) {
			throw new Error('JWT authentication requires user and jwtConfig to be set via withJwt()');
		}

		const jwt = JwtAuthenticationFactory.createJwt(
			{
				accountId: account.id,
				userId: this.user.id,
				schoolId: this.user.school.id,
				roles: [this.user.roles[0].id],
				support: false,
				isExternalUser: this.isExternalUser,
				systemId: this.systemId,
				isServiceAccount: this.isServiceAccount,
			},
			this.jwtConfig
		);

		return jwt;
	}

	private async authenticateWithCredentials(account: AccountForAuthentication): Promise<string> {
		const loginPath = this.isServiceAccount ? ENDPOINTS.SERVICE_ACCOUNT_LOGIN : ENDPOINTS.LOCAL_LOGIN;

		const response = await supertest(this.app.getHttpServer())
			.post(loginPath)
			.set(HTTP_HEADERS.ACCEPT, HTTP_HEADERS.APPLICATION_JSON)
			.send({
				username: account.username,
				password: defaultTestPassword,
			});

		return this.extractJwtFromResponse(response);
	}

	private extractJwtFromResponse(response: Response): string {
		if (response.error) {
			throw new Error(JSON.stringify(response.error));
		}

		if (!this.isAuthenticationResponse(response.body)) {
			throw new Error(`Invalid authentication response: ${JSON.stringify(response.body)}`);
		}

		return response.body.accessToken;
	}

	private isAuthenticationResponse(body: unknown): body is AuthenticationResponse {
		return typeof body === 'object' && body !== null && 'accessToken' in body;
	}

	private normalizeRoute(route: string): string {
		if (!route) return '/';

		return route.startsWith('/') ? route : `/${route}`;
	}
}

export class TestApiClient {
	private readonly app: INestApplication<Server>;

	private readonly baseRoute: string;

	private readonly authHeader: string;

	private readonly authHeaderName: string;

	constructor(app: INestApplication, baseRoute: string, authValue?: string, isApiKey = false) {
		this.app = app as INestApplication<Server>;
		this.baseRoute = baseRoute;
		this.authHeader = isApiKey ? (authValue ?? '') : `${AUTH_PREFIX} ${authValue ?? ''}`;
		this.authHeaderName = isApiKey ? HTTP_HEADERS.API_KEY : HTTP_HEADERS.AUTHORIZATION;
	}

	public get(subPath?: string): supertest.Test {
		return supertest(this.app.getHttpServer())
			.get(this.buildPath(subPath))
			.set(this.authHeaderName, this.authHeader)
			.set(HTTP_HEADERS.ACCEPT, HTTP_HEADERS.APPLICATION_JSON);
	}

	public post<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		return supertest(this.app.getHttpServer())
			.post(this.buildPath(subPath))
			.set(this.authHeaderName, this.authHeader)
			.set(HTTP_HEADERS.ACCEPT, HTTP_HEADERS.APPLICATION_JSON)
			.send(data);
	}

	public put<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		return supertest(this.app.getHttpServer())
			.put(this.buildPath(subPath))
			.set(this.authHeaderName, this.authHeader)
			.send(data);
	}

	public patch<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		return supertest(this.app.getHttpServer())
			.patch(this.buildPath(subPath))
			.set(this.authHeaderName, this.authHeader)
			.send(data);
	}

	public delete<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		return supertest(this.app.getHttpServer())
			.delete(this.buildPath(subPath))
			.set(this.authHeaderName, this.authHeader)
			.set(HTTP_HEADERS.ACCEPT, HTTP_HEADERS.APPLICATION_JSON)
			.send(data);
	}

	public postWithAttachment(
		subPath: string | undefined,
		fieldName: string,
		data: Buffer,
		fileName: string
	): supertest.Test {
		return supertest(this.app.getHttpServer())
			.post(this.buildPath(subPath))
			.set(this.authHeaderName, this.authHeader)
			.attach(fieldName, data, fileName);
	}

	public getAuthHeader(): string {
		return this.authHeader;
	}

	private buildPath(subPath?: string): string {
		if (!subPath) return this.baseRoute;

		const normalizedSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
		const fullPath = `${this.baseRoute}${normalizedSubPath}`;

		// Remove duplicate slashes
		return fullPath.replace(/\/+/g, '/');
	}
}
