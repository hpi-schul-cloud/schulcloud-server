import { ObjectId } from '@mikro-orm/mongodb';
import {
	Controller,
	Delete,
	Get,
	Headers,
	HttpStatus,
	INestApplication,
	Patch,
	Post,
	Put,
	UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { accountFactory } from '@modules/account/testing';
import { AuthenticatedTestApiClient, TestApiClientBuilder } from './test-api-client-builder';

@Controller('')
class TestController {
	@Delete(':id')
	public delete(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'delete', authorization });
	}

	@Post()
	public post(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'post', authorization });
	}

	@Get(':id')
	public get(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'get', authorization });
	}

	@Put()
	public put(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'put', authorization });
	}

	@Patch(':id')
	public patch(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'patch', authorization });
	}

	@Post('/authentication/local')
	public jwt() {
		return Promise.resolve({ accessToken: 'test-jwt-token-123' });
	}

	@Post('/authentication/local-service-account')
	public jwtServiceAccount() {
		return Promise.resolve({ accessToken: 'service-account-token-456' });
	}
}

@Controller('')
class TestErrorController {
	@Post('/authentication/local')
	public jwt() {
		return Promise.reject(new UnauthorizedException());
	}

	@Post('/authentication/local-service-account')
	public jwtServiceAccount() {
		return Promise.reject(new UnauthorizedException());
	}
}

@Controller('')
class TestXApiKeyController {
	@Delete(':id')
	public delete(@Headers('X-API-KEY') authorization: string) {
		return Promise.resolve({ method: 'delete', authorization });
	}

	@Post()
	public post(@Headers('X-API-KEY') authorization: string) {
		return Promise.resolve({ method: 'post', authorization });
	}

	@Get(':id')
	public get(@Headers('X-API-KEY') authorization: string) {
		return Promise.resolve({ method: 'get', authorization });
	}
}

describe(TestApiClientBuilder.name, () => {
	describe('when authentication endpoint throws an error', () => {
		let app: INestApplication;

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				controllers: [TestErrorController],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		it('should throw an error for standard authentication', async () => {
			const account = accountFactory.build();

			await expect(new TestApiClientBuilder(app, '').authenticate(account)).rejects.toThrow();
		});

		it('should throw an error for service account authentication', async () => {
			const account = accountFactory.build();

			await expect(new TestApiClientBuilder(app, '').asServiceAccount().authenticate(account)).rejects.toThrow();
		});
	});

	describe('when using JWT authentication', () => {
		let app: INestApplication;

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				controllers: [TestController],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		describe('authenticate', () => {
			it('should return an authenticated client with JWT', async () => {
				const account = accountFactory.build();

				const client = await new TestApiClientBuilder(app, '').authenticate(account);

				expect(client.getAuthHeader()).toEqual('Bearer test-jwt-token-123');
			});

			it('should return a new client instance', async () => {
				const account = accountFactory.build();
				const builder = new TestApiClientBuilder(app, '');

				const client = await builder.authenticate(account);

				expect(client).toBeInstanceOf(AuthenticatedTestApiClient);
			});
		});

		describe('asServiceAccount', () => {
			it('should authenticate using the service account endpoint', async () => {
				const account = accountFactory.build();

				const client = await new TestApiClientBuilder(app, '').asServiceAccount().authenticate(account);

				expect(client.getAuthHeader()).toEqual('Bearer service-account-token-456');
			});
		});

		describe('unauthenticated', () => {
			it('should return a client without authentication token', () => {
				const client = new TestApiClientBuilder(app, '/test').unauthenticated();

				expect(client.getAuthHeader()).toEqual('Bearer ');
			});
		});

		describe('HTTP methods', () => {
			const setup = async () => {
				const account = accountFactory.build();
				const client = await new TestApiClientBuilder(app, '').authenticate(account);
				const id = new ObjectId().toHexString();

				return { client, id };
			};

			describe('get', () => {
				it('should resolve requests with status OK', async () => {
					const { client, id } = await setup();

					const result = await client.get(id);

					expect(result.statusCode).toEqual(HttpStatus.OK);
					expect(result.body).toEqual(expect.objectContaining({ method: 'get' }));
				});

				it('should include the bearer token', async () => {
					const { client, id } = await setup();

					const result = await client.get(id);

					expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer test-jwt-token-123' }));
				});
			});

			describe('post', () => {
				it('should resolve requests with status CREATED', async () => {
					const { client } = await setup();

					const result = await client.post();

					expect(result.statusCode).toEqual(HttpStatus.CREATED);
					expect(result.body).toEqual(expect.objectContaining({ method: 'post' }));
				});

				it('should include the bearer token', async () => {
					const { client } = await setup();

					const result = await client.post();

					expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer test-jwt-token-123' }));
				});
			});

			describe('delete', () => {
				it('should resolve requests with status OK', async () => {
					const { client, id } = await setup();

					const result = await client.delete(id);

					expect(result.statusCode).toEqual(HttpStatus.OK);
					expect(result.body).toEqual(expect.objectContaining({ method: 'delete' }));
				});

				it('should include the bearer token', async () => {
					const { client, id } = await setup();

					const result = await client.delete(id);

					expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer test-jwt-token-123' }));
				});
			});

			describe('put', () => {
				it('should resolve requests with status OK', async () => {
					const { client } = await setup();

					const result = await client.put();

					expect(result.statusCode).toEqual(HttpStatus.OK);
					expect(result.body).toEqual(expect.objectContaining({ method: 'put' }));
				});

				it('should include the bearer token', async () => {
					const { client } = await setup();

					const result = await client.put();

					expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer test-jwt-token-123' }));
				});
			});

			describe('patch', () => {
				it('should resolve requests with status OK', async () => {
					const { client, id } = await setup();

					const result = await client.patch(id);

					expect(result.statusCode).toEqual(HttpStatus.OK);
					expect(result.body).toEqual(expect.objectContaining({ method: 'patch' }));
				});

				it('should include the bearer token', async () => {
					const { client, id } = await setup();

					const result = await client.patch(id);

					expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer test-jwt-token-123' }));
				});
			});
		});
	});

	describe('when using API key authentication', () => {
		let app: INestApplication;
		const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				controllers: [TestXApiKeyController],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		describe('withApiKey', () => {
			it('should return a client authenticated with API key', () => {
				const client = new TestApiClientBuilder(app, '').withApiKey(API_KEY);

				expect(client.getAuthHeader()).toEqual(API_KEY);
			});
		});

		describe('HTTP methods with API key', () => {
			const setup = () => {
				const client = new TestApiClientBuilder(app, '').withApiKey(API_KEY);
				const id = new ObjectId().toHexString();

				return { client, id };
			};

			describe('get', () => {
				it('should resolve requests with status OK', async () => {
					const { client, id } = setup();

					const result = await client.get(id);

					expect(result.statusCode).toEqual(HttpStatus.OK);
					expect(result.body).toEqual(expect.objectContaining({ method: 'get', authorization: API_KEY }));
				});
			});

			describe('post', () => {
				it('should resolve requests with status CREATED', async () => {
					const { client } = setup();

					const result = await client.post();

					expect(result.statusCode).toEqual(HttpStatus.CREATED);
					expect(result.body).toEqual(expect.objectContaining({ method: 'post', authorization: API_KEY }));
				});
			});

			describe('delete', () => {
				it('should resolve requests with status OK', async () => {
					const { client, id } = setup();

					const result = await client.delete(id);

					expect(result.statusCode).toEqual(HttpStatus.OK);
					expect(result.body).toEqual(expect.objectContaining({ method: 'delete', authorization: API_KEY }));
				});
			});
		});
	});

	describe('path handling', () => {
		let app: INestApplication;

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				controllers: [TestController],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		it('should handle base route without leading slash', async () => {
			const account = accountFactory.build();
			const client = await new TestApiClientBuilder(app, 'test-route').authenticate(account);

			expect(client).toBeInstanceOf(AuthenticatedTestApiClient);
		});

		it('should handle base route with leading slash', async () => {
			const account = accountFactory.build();
			const client = await new TestApiClientBuilder(app, '/test-route').authenticate(account);

			expect(client).toBeInstanceOf(AuthenticatedTestApiClient);
		});

		it('should handle empty base route', async () => {
			const account = accountFactory.build();
			const client = await new TestApiClientBuilder(app, '').authenticate(account);

			expect(client).toBeInstanceOf(AuthenticatedTestApiClient);
		});
	});
});

describe(AuthenticatedTestApiClient.name, () => {
	describe('getAuthHeader', () => {
		let app: INestApplication;

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				controllers: [TestController],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		it('should return the formatted auth header for JWT', async () => {
			const account = accountFactory.build();
			const client = await new TestApiClientBuilder(app, '').authenticate(account);

			expect(client.getAuthHeader()).toEqual('Bearer test-jwt-token-123');
		});

		it('should return the API key for API key auth', () => {
			const apiKey = 'test-api-key';
			const client = new TestApiClientBuilder(app, '').withApiKey(apiKey);

			expect(client.getAuthHeader()).toEqual(apiKey);
		});
	});
});
