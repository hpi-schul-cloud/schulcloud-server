import { ExecutionContext, INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { courseFactory, TestXApiKeyClient, UserAndAccountTestFactory } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ServerTestModule } from '@modules/server';
import { Logger } from '@src/core/logger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { TldrawService } from '../../service';
import { TldrawController } from '..';
import { TldrawRepo } from '../../repo';
import { tldrawEntityFactory } from '../../testing';

const baseRouteName = '/tldraw-document';
describe('tldraw controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testXApiKeyClient: TestXApiKeyClient;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
			controllers: [TldrawController],
			providers: [Logger, TldrawService, TldrawRepo],
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

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testXApiKeyClient = new TestXApiKeyClient(app, baseRouteName, API_KEY);
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

			const response = await testXApiKeyClient.delete(`${drawingItemData.docName}`);

			expect(response.status).toEqual(204);
		});
	});
});
