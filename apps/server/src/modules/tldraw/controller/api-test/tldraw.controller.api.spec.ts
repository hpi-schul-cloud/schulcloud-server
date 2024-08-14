import { StrategyType } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { Request } from 'express';
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
			imports: [ServerTestModule],
			controllers: [TldrawController],
			providers: [Logger, TldrawService, TldrawRepo],
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

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with valid user', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const drawingItemData = tldrawEntityFactory.build();

			await em.persistAndFlush([drawingItemData]);
			em.clear();

			return { teacherUser, drawingItemData };
		};

		it('should return status 200 for delete', async () => {
			const { drawingItemData } = await setup();

			const response = await testApiClient.delete(`${drawingItemData.docName}`);

			expect(response.status).toEqual(204);
		});
	});
});
