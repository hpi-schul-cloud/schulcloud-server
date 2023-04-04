import { Controller, Delete, Get, INestApplication, Post, Put, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ObjectId } from 'bson';
import { accountFactory } from './factory';
import { TestRequest } from './test-request';

@Controller('')
class TestController {
	@Delete(':id')
	async delete() {
		return Promise.resolve({});
	}

	@Post()
	async post() {
		return Promise.resolve({});
	}

	@Get(':id')
	async get() {
		return Promise.resolve({});
	}

	@Put(':id')
	async update() {
		return Promise.resolve({});
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

describe('test-request', () => {
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
			const request = new TestRequest(app, '');
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
			const request = new TestRequest(app, '');
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
				const { request, spy } = setup();

				const result = await request.get();

				expect(spy).toBeCalled();
				expect(result.statusCode).toBeDefined();
				expect(result.body).toBeDefined();
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
				expect(result.statusCode).toBeDefined();
				expect(result.body).toBeDefined();
			});

			it('should pass accout to getJwt request', async () => {
				const { request, spy, account } = setup();

				await request.post('', {}, account);

				expect(spy).toBeCalledWith(account);
			});
		});

		describe('delete', () => {
			it('should resolve requests', async () => {
				const { request, spy } = setup();

				const result = await request.delete();

				expect(spy).toBeCalled();
				expect(result.statusCode).toBeDefined();
				expect(result.body).toBeDefined();
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

				const result = await request.update();

				expect(spy).toBeCalled();
				expect(result.statusCode).toBeDefined();
				expect(result.body).toBeDefined();
			});

			it('should pass accout to getJwt request', async () => {
				const { request, spy, account, id } = setup();

				await request.update(id, {}, account);

				expect(spy).toBeCalledWith(account);
			});
		});
	});
});
