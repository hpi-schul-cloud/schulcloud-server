import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { School, System, User } from '@shared/domain';
import { cleanupCollections, mapUserToCurrentUser, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';

describe('UserLoginMigrationController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let currentUser: ICurrentUser | undefined;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
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

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[GET] /user-login-migrations', () => {
		describe('when data is given', () => {
			const setup = async () => {
				const date: Date = new Date(2023, 5, 4);
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					oauthMigrationStart: date,
					oauthMigrationFinished: date,
					oauthMigrationFinalFinish: date,
					oauthMigrationMandatory: date,
					systems: [sourceSystem],
				});
				const user: User = userFactory.buildWithId({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user]);

				currentUser = mapUserToCurrentUser(user);

				return {
					sourceSystem,
					targetSystem,
					school,
					user,
				};
			};

			it('should return the users migration', async () => {
				const { sourceSystem, targetSystem, school, user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.get(`/user-login-migrations`)
					.query({ userId: user.id });

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					data: [
						{
							sourceSystemId: sourceSystem.id,
							targetSystemId: targetSystem.id,
							startedAt: school.oauthMigrationStart?.toISOString(),
							closedAt: school.oauthMigrationFinished?.toISOString(),
							finishedAt: school.oauthMigrationFinalFinish?.toISOString(),
							mandatorySince: school.oauthMigrationMandatory?.toISOString(),
						},
					],
					total: 1,
				});
			});
		});

		describe('when unauthorized', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should return Unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer())
					.get(`/user-login-migrations`)
					.query({ userId: new ObjectId().toHexString() });

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
