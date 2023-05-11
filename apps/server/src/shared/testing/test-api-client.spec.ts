import {
	Controller,
	Delete,
	Get,
	HttpStatus,
	INestApplication,
	Patch,
	Post,
	Put,
	UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ObjectId } from 'bson';
import { accountFactory } from './factory';
import { TestApiClient } from './test-api-client';

@Controller('')
class TestController {
	@Delete(':id')
	async delete() {
		return Promise.resolve({ method: 'delete' });
	}

	@Post()
	async post() {
		return Promise.resolve({ method: 'post' });
	}

	@Get(':id')
	async get() {
		return Promise.resolve({ method: 'get' });
	}

	@Put()
	async put() {
		return Promise.resolve({ method: 'put' });
	}

	@Patch(':id')
	async patch() {
		return Promise.resolve({ method: 'patch' });
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
			const request = new TestApiClient(app, '');
			const account = accountFactory.build();

			return { request, account };
		};

		it('should throw an error', async () => {
			const { request, account } = setup();

			await expect(() => request.getJwt(account)).rejects.toThrowError();
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
			const request = new TestApiClient(app, '');
			const account = accountFactory.build();
			const id = new ObjectId().toHexString();

			const spy = jest.spyOn(request, 'getJwt');

			return { request, spy, account, id };
		};

		describe('getJwt', () => {
			it('should return "invalidJwt" if no account is passed', async () => {
				const { request } = setup();

				const result = await request.getJwt();

				expect(result).toEqual('invalidJwt');
			});

			it('should return well formed jwt by passing the account', async () => {
				const { request, account } = setup();

				const result = await request.getJwt(account);

				expect(result).toEqual('Bearer 123');
			});
		});

		describe('get', () => {
			it('should resolve requests', async () => {
				const { request, spy, id } = setup();

				const result = await request.get(id);

				expect(spy).toBeCalled();
				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual({ method: 'get' });
			});

			it('should pass accout to getJwt request', async () => {
				const { request, spy, account, id } = setup();

				await request.get(id, account);

				expect(spy).toBeCalledWith(account);
			});
		});

		describe('post', () => {
			it('should resolve requests', async () => {
				const { request, spy } = setup();

				const result = await request.post();

				expect(spy).toBeCalled();
				expect(result.statusCode).toEqual(HttpStatus.CREATED);
				expect(result.body).toEqual({ method: 'post' });
			});

			it('should pass accout to getJwt request', async () => {
				const { request, spy, account } = setup();

				await request.post('', {}, account);

				expect(spy).toBeCalledWith(account);
			});
		});

		describe('delete', () => {
			it('should resolve requests', async () => {
				const { request, spy, id } = setup();

				const result = await request.delete(id);

				expect(spy).toBeCalled();
				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual({ method: 'delete' });
			});

			it('should pass accout to getJwt request', async () => {
				const { request, spy, account, id } = setup();

				await request.delete(id, account);

				expect(spy).toBeCalledWith(account);
			});
		});

		describe('put', () => {
			it('should resolve requests', async () => {
				const { request, spy } = setup();

				const result = await request.put();

				expect(spy).toBeCalled();
				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual({ method: 'put' });
			});

			it('should pass accout to getJwt request', async () => {
				const { request, spy, account } = setup();

				await request.put('', {}, account);

				expect(spy).toBeCalledWith(account);
			});
		});

		describe('patch', () => {
			it('should resolve requests', async () => {
				const { request, spy, id } = setup();

				const result = await request.patch(id);

				expect(spy).toBeCalled();
				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual({ method: 'patch' });
			});

			it('should pass accout to getJwt request', async () => {
				const { request, spy, account, id } = setup();

				await request.patch(id, {}, account);

				expect(spy).toBeCalledWith(account);
			});
		});
	});
});
