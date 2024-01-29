import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ServerTestModule } from '@modules/server';
import { Logger } from '@src/core/logger';
import { TldrawService } from '../../service';
import { TldrawController } from '..';
import { TldrawRepo } from '../../repo';
import { tldrawEntityFactory } from '../../testing';

const baseRouteName = '/tldraw-document';
describe('tldraw controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
			controllers: [TldrawController],
			providers: [Logger, TldrawService, TldrawRepo],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with valid user', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const drawingItemData = tldrawEntityFactory.build();

			await em.persistAndFlush([drawingItemData]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, teacherUser, drawingItemData };
		};

		it('should return status 200 for delete', async () => {
			const { loggedInClient, drawingItemData } = await setup();

			const response = await loggedInClient.delete(`${drawingItemData.docName}`);

			expect(response.status).toEqual(204);
		});

		it('should return status 404 for delete with wrong id', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.delete(`testID123`);

			expect(response.status).toEqual(404);
		});
	});
});
