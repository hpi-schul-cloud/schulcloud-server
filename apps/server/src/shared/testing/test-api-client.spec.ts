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
import { ObjectId } from '@mikro-orm/mongodb';
import { accountFactory } from './factory';
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

	describe('when test request instance exists', () => {
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
				expect(loggedInClient['formattedJwt']).toEqual('Bearer 123');
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
});
