import { Controller, Delete, Get, INestApplication, Post, Put } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestRequest } from '.';

@Controller('test')
export class TestController {
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
}

describe('test-request', () => {
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

	describe('when test request instance exists', () => {
		const setup = () => {
			const request = new TestRequest(app, 'test');

			const spy = jest.spyOn(request, 'getJwt').mockResolvedValueOnce('123');

			return { request, spy };
		};

		// not well tested, but not easy if we want to avoid duplicated tests
		it('should has a getJWT handler', () => {
			const { request } = setup();

			expect(request.getJwt).toBeDefined();
		});

		it('should resolve get requests', async () => {
			const { request, spy } = setup();

			const result = await request.get();

			expect(spy).toBeCalled();
			expect(result.statusCode).toBeDefined();
			expect(result.body).toBeDefined();
		});

		it('should resolve post requests', async () => {
			const { request, spy } = setup();

			const result = await request.post();

			expect(spy).toBeCalled();
			expect(result.statusCode).toBeDefined();
			expect(result.body).toBeDefined();
		});

		it('should resolve delete requests', async () => {
			const { request, spy } = setup();

			const result = await request.delete();

			expect(spy).toBeCalled();
			expect(result.statusCode).toBeDefined();
			expect(result.body).toBeDefined();
		});

		it('should resolve put requests', async () => {
			const { request, spy } = setup();

			const result = await request.update();

			expect(spy).toBeCalled();
			expect(result.statusCode).toBeDefined();
			expect(result.body).toBeDefined();
		});
	});
});
