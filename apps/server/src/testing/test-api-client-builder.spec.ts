import { ObjectId } from '@mikro-orm/mongodb';
import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	HttpStatus,
	type INestApplication,
	Patch,
	Post,
	Put,
	UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { accountFactory } from '@modules/account/testing';
import { TestApiClient, TestApiClientBuilder } from './test-api-client-builder';

interface AuthRequestBody {
	simulateError?: boolean;
}

@Controller('')
class TestController {
	@Delete(':id')
	public delete(@Headers('authorization') authorization: string, @Headers('X-API-KEY') apiKey: string) {
		return Promise.resolve({ method: 'delete', authorization: authorization || apiKey });
	}

	@Post()
	public post(@Headers('authorization') authorization: string, @Headers('X-API-KEY') apiKey: string) {
		return Promise.resolve({ method: 'post', authorization: authorization || apiKey });
	}

	@Get(':id')
	public get(@Headers('authorization') authorization: string, @Headers('X-API-KEY') apiKey: string) {
		return Promise.resolve({ method: 'get', authorization: authorization || apiKey });
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
	public jwt(@Body() body: AuthRequestBody) {
		if (body.simulateError) {
			return Promise.reject(new UnauthorizedException());
		}

		return Promise.resolve({ accessToken: 'test-jwt-token-123' });
	}

	@Post('/authentication/local-service-account')
	public jwtServiceAccount(@Body() body: AuthRequestBody) {
		if (body.simulateError) {
			return Promise.reject(new UnauthorizedException());
		}

		return Promise.resolve({ accessToken: 'service-account-token-456' });
	}
}

describe(TestApiClientBuilder.name, () => {
	let module: TestingModule;
	let app: INestApplication;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [TestController],
		}).compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('build', () => {
		describe('when called without account', () => {
			it('should return an unauthenticated client', () => {
				const client = new TestApiClientBuilder(app, '/test').build();

				expect(client).toBeInstanceOf(TestApiClient);
				expect(client.getAuthHeader()).toEqual('Bearer ');
			});
		});

		describe('when called with account', () => {
			const setup = () => {
				const account = accountFactory.build();

				return { account };
			};

			it('should return an authenticated client with JWT', async () => {
				const { account } = setup();

				const client = await new TestApiClientBuilder(app, '').build(account);

				expect(client.getAuthHeader()).toEqual('Bearer test-jwt-token-123');
			});

			it('should return a new client instance', async () => {
				const { account } = setup();

				const client = await new TestApiClientBuilder(app, '').build(account);

				expect(client).toBeInstanceOf(TestApiClient);
			});
		});
	});

	describe('asServiceAccount', () => {
		describe('when authenticating as service account', () => {
			const setup = () => {
				const account = accountFactory.build();

				return { account };
			};

			it('should authenticate using the service account endpoint', async () => {
				const { account } = setup();

				const client = await new TestApiClientBuilder(app, '').asServiceAccount().build(account);

				expect(client.getAuthHeader()).toEqual('Bearer service-account-token-456');
			});
		});
	});

	describe('withApiKey', () => {
		describe('when authenticating with API key', () => {
			const setup = () => {
				const apiKey = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

				return { apiKey };
			};

			it('should return a client authenticated with API key', () => {
				const { apiKey } = setup();

				const client = new TestApiClientBuilder(app, '').withApiKey(apiKey).build();

				expect(client.getAuthHeader()).toEqual(apiKey);
			});
		});
	});

	describe('path handling', () => {
		describe('when base route has no leading slash', () => {
			const setup = () => {
				const account = accountFactory.build();

				return { account };
			};

			it('should normalize the route', async () => {
				const { account } = setup();

				const client = await new TestApiClientBuilder(app, 'test-route').build(account);

				expect(client).toBeInstanceOf(TestApiClient);
			});
		});

		describe('when base route has leading slash', () => {
			const setup = () => {
				const account = accountFactory.build();

				return { account };
			};

			it('should keep the route unchanged', async () => {
				const { account } = setup();

				const client = await new TestApiClientBuilder(app, '/test-route').build(account);

				expect(client).toBeInstanceOf(TestApiClient);
			});
		});

		describe('when base route is empty', () => {
			const setup = () => {
				const account = accountFactory.build();

				return { account };
			};

			it('should handle empty route', async () => {
				const { account } = setup();

				const client = await new TestApiClientBuilder(app, '').build(account);

				expect(client).toBeInstanceOf(TestApiClient);
			});
		});
	});
});

describe(TestApiClient.name, () => {
	let module: TestingModule;
	let app: INestApplication;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [TestController],
		}).compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('get', () => {
		describe('when using JWT authentication', () => {
			const setup = async () => {
				const account = accountFactory.build();
				const client = await new TestApiClientBuilder(app, '').build(account);
				const id = new ObjectId().toHexString();

				return { client, id };
			};

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

		describe('when using API key authentication', () => {
			const setup = () => {
				const apiKey = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';
				const client = new TestApiClientBuilder(app, '').withApiKey(apiKey).build();
				const id = new ObjectId().toHexString();

				return { client, id, apiKey };
			};

			it('should resolve requests with status OK', async () => {
				const { client, id, apiKey } = setup();

				const result = await client.get(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'get', authorization: apiKey }));
			});
		});
	});

	describe('post', () => {
		describe('when using JWT authentication', () => {
			const setup = async () => {
				const account = accountFactory.build();
				const client = await new TestApiClientBuilder(app, '').build(account);

				return { client };
			};

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

		describe('when using API key authentication', () => {
			const setup = () => {
				const apiKey = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';
				const client = new TestApiClientBuilder(app, '').withApiKey(apiKey).build();

				return { client, apiKey };
			};

			it('should resolve requests with status CREATED', async () => {
				const { client, apiKey } = setup();

				const result = await client.post();

				expect(result.statusCode).toEqual(HttpStatus.CREATED);
				expect(result.body).toEqual(expect.objectContaining({ method: 'post', authorization: apiKey }));
			});
		});
	});

	describe('delete', () => {
		describe('when using JWT authentication', () => {
			const setup = async () => {
				const account = accountFactory.build();
				const client = await new TestApiClientBuilder(app, '').build(account);
				const id = new ObjectId().toHexString();

				return { client, id };
			};

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

		describe('when using API key authentication', () => {
			const setup = () => {
				const apiKey = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';
				const client = new TestApiClientBuilder(app, '').withApiKey(apiKey).build();
				const id = new ObjectId().toHexString();

				return { client, id, apiKey };
			};

			it('should resolve requests with status OK', async () => {
				const { client, id, apiKey } = setup();

				const result = await client.delete(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'delete', authorization: apiKey }));
			});
		});
	});

	describe('put', () => {
		describe('when using JWT authentication', () => {
			const setup = async () => {
				const account = accountFactory.build();
				const client = await new TestApiClientBuilder(app, '').build(account);

				return { client };
			};

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
	});

	describe('patch', () => {
		describe('when using JWT authentication', () => {
			const setup = async () => {
				const account = accountFactory.build();
				const client = await new TestApiClientBuilder(app, '').build(account);
				const id = new ObjectId().toHexString();

				return { client, id };
			};

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

	describe('getAuthHeader', () => {
		describe('when using JWT authentication', () => {
			const setup = async () => {
				const account = accountFactory.build();
				const client = await new TestApiClientBuilder(app, '').build(account);

				return { client };
			};

			it('should return the formatted auth header', async () => {
				const { client } = await setup();

				expect(client.getAuthHeader()).toEqual('Bearer test-jwt-token-123');
			});
		});

		describe('when using API key authentication', () => {
			const setup = () => {
				const apiKey = 'test-api-key';
				const client = new TestApiClientBuilder(app, '').withApiKey(apiKey).build();

				return { client, apiKey };
			};

			it('should return the API key', () => {
				const { client, apiKey } = setup();

				expect(client.getAuthHeader()).toEqual(apiKey);
			});
		});
	});
});
