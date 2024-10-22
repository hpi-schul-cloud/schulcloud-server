import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthGuardModule, AuthGuardOptions } from '@src/infra/auth-guard';
import { TldrawController } from '..';
import { TldrawRepo } from '../../repo';
import { TldrawService } from '../../service';
import { tldrawEntityFactory } from '../../testing';

const baseRouteName = '/tldraw-document';
describe('tldraw controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule, AuthGuardModule.register([AuthGuardOptions.X_API_KEY])],
			controllers: [TldrawController],
			providers: [Logger, TldrawService, TldrawRepo],
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
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const drawingItemData = tldrawEntityFactory.build();

			await em.persistAndFlush([drawingItemData]);
			em.clear();

			return { teacherUser, drawingItemData };
		};

		it('should return status 401 for delete', async () => {
			const { drawingItemData } = await setup();

			const response = await testApiClient.delete(`${drawingItemData.docName}`);

			expect(response.status).toEqual(401);
		});
	});
});
