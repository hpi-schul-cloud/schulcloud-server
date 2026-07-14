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
 * const client = new TestApiClientBuilder(app, 'external-api').withApiKey('my-api-key');
 *
 * @example
 * // Unauthenticated request (for testing 401 responses)
 * const response = await new TestApiClientBuilder(app, 'users').unauthenticated().get();
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

	public constructor(app: INestApplication, baseRoute: string) {
		this.app = app as INestApplication<Server>;
		this.baseRoute = this.normalizeRoute(baseRoute);
	}

	public asServiceAccount(): this {
		this.isServiceAccount = true;
		return this;
	}

	public asExternalUser(): this {
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
		this.user = user;
		this.jwtConfig = jwtConfig;
		return this;
	}

	/**
	 * Creates an API client authenticated with an API key.
	 * This is a terminal operation and returns the client directly (not a Promise).
	 */
	public withApiKey(apiKey: string): AuthenticatedTestApiClient {
		this.apiKey = apiKey;
		return new AuthenticatedTestApiClient(this.app, this.baseRoute, apiKey, true);
	}

	/**
	 * Creates an unauthenticated client for testing unauthorized access.
	 * This is a terminal operation.
	 */
	public unauthenticated(): AuthenticatedTestApiClient {
		return new AuthenticatedTestApiClient(this.app, this.baseRoute);
	}

	/**
	 * Authenticates with the given account and returns an authenticated client.
	 * This is the terminal operation that completes the builder chain.
	 *
	 * @param account - The account to authenticate with
	 * @returns An authenticated TestApiClient instance
	 */
	public async authenticate(account: AccountForAuthentication): Promise<AuthenticatedTestApiClient> {
		if (this.shouldUseJwtAuthentication()) {
			return this.authenticateWithJwt(account);
		}

		return this.authenticateWithCredentials(account);
	}

	private shouldUseJwtAuthentication(): boolean {
		return this.user !== undefined && this.jwtConfig !== undefined;
	}

	private async authenticateWithJwt(account: AccountForAuthentication): Promise<AuthenticatedTestApiClient> {
		if (!this.user || !this.jwtConfig) {
			throw new Error('JWT authentication requires user and jwtConfig to be set via withJwt()');
		}

		const jwtWhitelistAdapter = this.app.get(JwtWhitelistAdapter);

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

		await jwtWhitelistAdapter.addToWhitelist(account.id, 'jti');

		return new AuthenticatedTestApiClient(this.app, this.baseRoute, jwt);
	}

	private async authenticateWithCredentials(account: AccountForAuthentication): Promise<AuthenticatedTestApiClient> {
		const loginPath = this.isServiceAccount ? ENDPOINTS.SERVICE_ACCOUNT_LOGIN : ENDPOINTS.LOCAL_LOGIN;

		const response = await supertest(this.app.getHttpServer())
			.post(loginPath)
			.set(HTTP_HEADERS.ACCEPT, HTTP_HEADERS.APPLICATION_JSON)
			.send({
				username: account.username,
				password: defaultTestPassword,
			});

		const jwt = this.extractJwtFromResponse(response);

		return new AuthenticatedTestApiClient(this.app, this.baseRoute, jwt);
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

/**
 * An authenticated HTTP client for API testing.
 * Provides methods for making HTTP requests with authentication.
 */
export class AuthenticatedTestApiClient {
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
