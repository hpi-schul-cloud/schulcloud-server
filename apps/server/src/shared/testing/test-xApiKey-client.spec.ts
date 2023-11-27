import { Controller, Delete, ExecutionContext, Get, Headers, HttpStatus, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ObjectId } from 'bson';
import { AuthGuard } from '@nestjs/passport';
import { TestApiClient } from './test-api-client';

@Controller('')
class TestController {
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
	describe('when test request instance exists', () => {
		let app: INestApplication;
		const API_KEY = '1ab2c3d4e5f61ab2c3d4e5f6';

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				controllers: [TestController],
			})
				.overrideGuard(AuthGuard('api-key'))
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
			const testApiClient = new TestApiClient(app, '');
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
