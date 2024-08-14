import { ObjectId } from '@mikro-orm/mongodb';
import {
	Controller,
	Delete,
	ExecutionContext,
	Get,
	Headers,
	HttpStatus,
	INestApplication,
	Patch,
	Post,
	Put,
	UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';

import { StrategyType } from '@infra/auth-guard';
import { accountFactory } from '@src/modules/account/testing';
import { TestApiClient } from './test-api-client';

@Controller('')
class TestController {
	@Delete(':id')
	async delete(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'delete', authorization });
	}

	@Post()
	async post(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'post', authorization });
	}

	@Get(':id')
	async get(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'get', authorization });
	}

	@Put()
	async put(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'put', authorization });
	}

	@Patch(':id')
	async patch(@Headers('authorization') authorization: string) {
		return Promise.resolve({ method: 'patch', authorization });
	}

	@Post('/authentication/local')
	async jwt() {
		return Promise.resolve({ accessToken: '123' });
	}
}

@Controller('')
class TestErrorController {
	@Post('/authentication/local')
	async jwt() {
		return Promise.reject(new UnauthorizedException());
	}
}

@Controller('')
class TestXApiKeyController {
	@Delete(':id')
	async delete(@Headers('X-API-KEY') authorization: string) {
		return Promise.resolve({ method: 'delete', authorization });
	}

	@Post()
	async post(@Headers('X-API-KEY') authorization: string) {
		return Promise.resolve({ method: 'post', authorization });
	}

	@Get(':id')
	async get(@Headers('X-API-KEY') authorization: string) {
		return Promise.resolve({ method: 'get', authorization });
	}
}

describe(TestApiClient.name, () => {
	describe('when /authentication/local throw an error', () => {
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

		const setup = () => {
			const testApiClient = new TestApiClient(app, '');
			const account = accountFactory.build();

			return { testApiClient, account };
		};

		it('should throw an error', async () => {
			const { testApiClient, account } = setup();

			await expect(() => testApiClient.login(account)).rejects.toThrowError();
		});
	});

	describe('when test request instance exists - jwt auth', () => {
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

		const setup = () => {
			const testApiClient = new TestApiClient(app, '');
			const account = accountFactory.build();
			const id = new ObjectId().toHexString();

			return { testApiClient, account, id };
		};

		describe('login', () => {
			it('should store formatted jwt', async () => {
				const { testApiClient, account } = setup();

				const loggedInClient = await testApiClient.login(account);

				// eslint-disable-next-line @typescript-eslint/dot-notation
				expect(loggedInClient['authHeader']).toEqual('Bearer 123');
			});

			it('should fork the client', async () => {
				const { testApiClient, account } = setup();

				const loggedInClient = await testApiClient.login(account);

				expect(loggedInClient).not.toStrictEqual(testApiClient);
			});
		});

		describe('get', () => {
			it('should resolve requests', async () => {
				const { testApiClient, id } = setup();

				const result = await testApiClient.get(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'get' }));
			});

			it('should pass the bearer token', async () => {
				const { testApiClient, account, id } = setup();

				const loggedInClient = await testApiClient.login(account);
				const result = await loggedInClient.get(id);

				expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer 123' }));
			});
		});

		describe('post', () => {
			it('should resolve requests', async () => {
				const { testApiClient } = setup();

				const result = await testApiClient.post();

				expect(result.statusCode).toEqual(HttpStatus.CREATED);
				expect(result.body).toEqual(expect.objectContaining({ method: 'post' }));
			});

			it('should pass the bearer token', async () => {
				const { testApiClient, account } = setup();

				const loggedInClient = await testApiClient.login(account);
				const result = await loggedInClient.post();

				expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer 123' }));
			});
		});

		describe('delete', () => {
			it('should resolve requests', async () => {
				const { testApiClient, id } = setup();

				const result = await testApiClient.delete(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'delete' }));
			});

			it('should pass the bearer token', async () => {
				const { testApiClient, account, id } = setup();

				const loggedInClient = await testApiClient.login(account);
				const result = await loggedInClient.delete(id);

				expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer 123' }));
			});
		});

		describe('put', () => {
			it('should resolve requests', async () => {
				const { testApiClient } = setup();

				const result = await testApiClient.put();

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'put' }));
			});

			it('should pass the bearer token', async () => {
				const { testApiClient, account } = setup();

				const loggedInClient = await testApiClient.login(account);
				const result = await loggedInClient.put();

				expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer 123' }));
			});
		});

		describe('patch', () => {
			it('should resolve requests', async () => {
				const { testApiClient, id } = setup();

				const result = await testApiClient.patch(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'patch' }));
			});

			it('should pass the bearer token', async () => {
				const { testApiClient, account, id } = setup();

				const loggedInClient = await testApiClient.login(account);
				const result = await loggedInClient.patch(id);

				expect(result.body).toEqual(expect.objectContaining({ authorization: 'Bearer 123' }));
			});
		});
	});

	describe('when test request instance exists - x-api-key auth', () => {
		let app: INestApplication;
		const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				controllers: [TestXApiKeyController],
			})
				.overrideGuard(AuthGuard(StrategyType.API_KEY))
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						req.headers['X-API-KEY'] = API_KEY;
						return true;
					},
				})
				.compile();

			app = moduleFixture.createNestApplication();

			await app.init();
		});

		afterAll(async () => {
			await app.close();
		});

		const setup = () => {
			const testApiClient = new TestApiClient(app, '', API_KEY, true);
			const id = new ObjectId().toHexString();

			return { testApiClient, id };
		};

		describe('get', () => {
			it('should resolve requests', async () => {
				const { testApiClient, id } = setup();

				const result = await testApiClient.get(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'get' }));
			});
		});

		describe('post', () => {
			it('should resolve requests', async () => {
				const { testApiClient } = setup();

				const result = await testApiClient.post();

				expect(result.statusCode).toEqual(HttpStatus.CREATED);
				expect(result.body).toEqual(expect.objectContaining({ method: 'post' }));
			});
		});

		describe('delete', () => {
			it('should resolve requests', async () => {
				const { testApiClient, id } = setup();

				const result = await testApiClient.delete(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'delete' }));
			});
		});
	});
});
