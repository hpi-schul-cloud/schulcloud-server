import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, userFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';

describe('Rooms Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	describe('[GET] cards', () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const cardIds = [new ObjectId(), new ObjectId()];

			return { cardIds };
		};

		it('should fail when no ids are passed', async () => {
			await setup();

			const response = await request(app.getHttpServer()).get(`/cards`);

			expect(response.status).toEqual(400);
		});

		it('should return mock for single id', async () => {
			const { cardIds } = await setup();

			const response = await request(app.getHttpServer()).get(`/cards?ids=${cardIds[0].toString()}`);

			expect(response.status).toEqual(200);
		});

		it('should return mock for multiple ids', async () => {
			const { cardIds } = await setup();

			const response = await request(app.getHttpServer()).get(
				`/cards?ids=${cardIds[0].toString()}&ids=${cardIds[1].toString()}`
			);

			expect(response.status).toEqual(200);
		});
	});
});
