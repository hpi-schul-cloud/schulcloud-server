import { Controller, Delete, ExecutionContext, Get, Headers, HttpStatus, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthGuard } from '@nestjs/passport';
import { TestXApiKeyClient } from './test-xApiKey-client';

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

describe(TestXApiKeyClient.name, () => {
	describe('when test request instance exists', () => {
		let app: INestApplication;
		const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

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
			const testXApiKeyClient = new TestXApiKeyClient(app, '');
			const id = new ObjectId().toHexString();

			return { testXApiKeyClient, id };
		};

		describe('get', () => {
			it('should resolve requests', async () => {
				const { testXApiKeyClient, id } = setup();

				const result = await testXApiKeyClient.get(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'get' }));
			});
		});

		describe('post', () => {
			it('should resolve requests', async () => {
				const { testXApiKeyClient } = setup();

				const result = await testXApiKeyClient.post();

				expect(result.statusCode).toEqual(HttpStatus.CREATED);
				expect(result.body).toEqual(expect.objectContaining({ method: 'post' }));
			});
		});

		describe('delete', () => {
			it('should resolve requests', async () => {
				const { testXApiKeyClient, id } = setup();

				const result = await testXApiKeyClient.delete(id);

				expect(result.statusCode).toEqual(HttpStatus.OK);
				expect(result.body).toEqual(expect.objectContaining({ method: 'delete' }));
			});
		});
	});
});
