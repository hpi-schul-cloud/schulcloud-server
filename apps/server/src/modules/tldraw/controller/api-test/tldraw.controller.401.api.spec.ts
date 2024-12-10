import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@shared/testing';
import { tldrawEntityFactory } from '../../testing';
import { TldrawApiTestModule } from '../../tldraw-api-test.module';

const baseRouteName = '/tldraw-document';
describe('tldraw controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [TldrawApiTestModule.forRoot()],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when request does not contain token', () => {
		const setup = async () => {
			const drawingItemData = tldrawEntityFactory.build();

			await em.persistAndFlush([drawingItemData]);
			em.clear();

			return { drawingItemData };
		};

		it('should return status 204 for delete', async () => {
			const { drawingItemData } = await setup();

			const response = await testApiClient.delete(`${drawingItemData.docName}`);

			expect(response.status).toEqual(401);
		});
	});
});
