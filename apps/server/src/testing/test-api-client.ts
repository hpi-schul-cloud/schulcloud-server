import type { AccountEntity } from '@modules/account/repo';
import { defaultTestPassword } from '@modules/account/testing/account.factory';
import { INestApplication } from '@nestjs/common';
import type { Server } from 'node:net';
import supertest, { Response } from 'supertest';
import { JwtAuthenticationFactory } from './factory/jwt-authentication.factory';
import { TestJwtModuleConfig } from './test-jwt-module.config';

interface AccountForLogin {
	id: string;
}

interface UserForLogin {
	id: string;
	school: { id: string };
	roles: ArrayLike<{ id: string }>;
}

interface JwtOptions {
	isExternalUser?: boolean;
	systemId?: string;
	isServiceAccount?: boolean;
}

interface AuthenticationResponse {
	accessToken: string;
}

const headerConst = {
	accept: 'accept',
	json: 'application/json',
};

const testRequestConst = {
	prefix: 'Bearer',
	loginPath: '/authentication/local',
	serviceAccountLoginPath: '/authentication/local-service-account',
	accessToken: 'accessToken',
	errorMessage: 'TestApiClient: Can not cast to local AutenticationResponse:',
};

/**
 * Note res.cookie is not supported atm, feel free to add this
 */
export class TestApiClient {
	private readonly app: INestApplication<Server>;

	private readonly baseRoute: string;

	private readonly authHeader: string;

	private readonly kindOfAuth: string;

	constructor(app: INestApplication, baseRoute: string, authValue?: string, useAsApiKey = false) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		this.app = app;
		this.baseRoute = this.checkAndAddPrefix(baseRoute);
		this.authHeader = useAsApiKey ? `${authValue || ''}` : `${testRequestConst.prefix} ${authValue || ''}`;
		this.kindOfAuth = useAsApiKey ? 'X-API-KEY' : 'authorization';
	}

	public get(subPath?: string): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.get(path)
			.set(this.kindOfAuth, this.authHeader)
			.set(headerConst.accept, headerConst.json);

		return testRequestInstance;
	}

	public delete<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.delete(path)
			.set(this.kindOfAuth, this.authHeader)
			.set(headerConst.accept, headerConst.json)
			.send(data);

		return testRequestInstance;
	}

	public put<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.put(path)
			.set(this.kindOfAuth, this.authHeader)
			.send(data);

		return testRequestInstance;
	}

	public patch<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.patch(path)
			.set(this.kindOfAuth, this.authHeader)
			.send(data);

		return testRequestInstance;
	}

	public post<T extends object | string>(subPath?: string, data?: T): supertest.Test {
		const path = this.getPath(subPath);
		const testRequestInstance = supertest(this.app.getHttpServer())
			.post(path)
			.set(this.kindOfAuth, this.authHeader)
			.set(headerConst.accept, headerConst.json)
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
			.set(this.kindOfAuth, this.authHeader)
			.attach(fieldName, data, fileName);

		return testRequestInstance;
	}

	/**
	 * Authenticates with the given account and returns a new TestApiClient with the JWT token.
	 * Includes retry logic to handle race conditions during app initialization.
	 *
	 * @param account - The account to authenticate with
	 * @param options - Optional configuration for retry behavior
	 * @returns A new TestApiClient instance authenticated with the account's JWT
	 */
	public async login(account: AccountEntity, options: { retries?: number; retryDelay?: number } = {}): Promise<this> {
		const result = await this.loginInternal(account, options);

		return result;
	}

	/**
	 * Authenticates with the given service account and returns a new TestApiClient with
	 * the JWT token. 	 * Includes retry logic to handle race conditions during app
	 * initialization.
	 *
	 * @param account - The account to authenticate with
	 * @param options - Optional configuration for retry behavior
	 * @returns A new TestApiClient instance authenticated with the account's JWT
	 */
	public async loginAsServiceAccount(
		account: AccountEntity,
		options: { retries?: number; retryDelay?: number } = {}
	): Promise<this> {
		const result = await this.loginInternal(account, { ...options, isServiceAccount: true });

		return result;
	}

	private async loginInternal(
		account: AccountEntity,
		options: { retries?: number; retryDelay?: number; isServiceAccount?: boolean } = {}
	): Promise<this> {
		const { retries = 3, retryDelay = 200, isServiceAccount = false } = options;
		const path = isServiceAccount ? testRequestConst.serviceAccountLoginPath : testRequestConst.loginPath;
		const params: { username: string; password: string } = {
			username: account.username,
			password: defaultTestPassword,
		};

		let lastError: Error | undefined;

		for (let attempt = 0; attempt <= retries; attempt += 1) {
			try {
				const response = await supertest(this.app.getHttpServer())
					.post(path)
					.set(headerConst.accept, headerConst.json)
					.send(params);

				const jwtFromResponse = this.getJwtFromResponse(response);

				return new (this.constructor as new (app: INestApplication, baseRoute: string, authValue?: string) => this)(
					this.app,
					this.baseRoute,
					jwtFromResponse
				);
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// Only retry on connection/initialization errors, not on actual auth failures
				const isRetryableError =
					lastError.message.includes('404') ||
					lastError.message.includes('ECONNRESET') ||
					lastError.message.includes('ECONNREFUSED') ||
					lastError.message.includes('Cannot POST');

				if (!isRetryableError || attempt === retries) {
					throw lastError;
				}

				// Wait before retrying with exponential backoff
				await this.sleep(retryDelay * (attempt + 1));
			}
		}

		throw lastError ?? new Error('Login failed after retries');
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	public loginByUser(
		account: AccountForLogin,
		user: UserForLogin,
		jwtConfig: TestJwtModuleConfig,
		options: JwtOptions = {}
	): this {
		const jwt = JwtAuthenticationFactory.createJwt(
			{
				accountId: account.id,
				userId: user.id,
				schoolId: user.school.id,
				roles: [user.roles[0].id],
				support: false,
				isExternalUser: options.isExternalUser ?? false,
				systemId: options.systemId,
				isServiceAccount: options.isServiceAccount ?? false,
			},
			jwtConfig
		);

		return new (this.constructor as new (app: INestApplication, baseRoute: string, authValue: string) => this)(
			this.app,
			this.baseRoute,
			jwt
		);
	}

	public getAuthHeader(): string {
		return this.authHeader;
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
		const isAuthenticationResponse = typeof body === 'object' && body !== null && testRequestConst.accessToken in body;

		return isAuthenticationResponse;
	}

	private getJwtFromResponse(response: Response): string {
		if (response.error) {
			const error = JSON.stringify(response.error);
			throw new Error(error);
		}
		if (!this.isAuthenticationResponse(response.body)) {
			const body = JSON.stringify(response.body);
			throw new Error(`${testRequestConst.errorMessage} ${body}`);
		}
		const authenticationResponse = response.body;
		const jwt = authenticationResponse.accessToken;

		return jwt;
	}
}
