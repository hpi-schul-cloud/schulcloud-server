import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser, schoolFactory, userFactory } from '@shared/testing';
import { UserImportPermissions } from '@src/modules/user-import/constants';
import { School, User } from '@shared/domain';

describe('ImportUser Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let user: User;
	let school: School;

	beforeAll(async () => {
		school = schoolFactory.build();
		user = userFactory.build({ school });
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					const { currentUser } = createCurrentTestUser(
						[
							UserImportPermissions.VIEW_SCHOOLS_IMPORT_USERS,
							UserImportPermissions.STUDENT_LIST,
							UserImportPermissions.TEACHER_LIST,
						],
						user
					);
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
	});

	afterAll(async () => {
		await app.close();
		await orm.close();
	});

	it('[GET] user/import', async () => {
		const response = await request(app.getHttpServer()).get('/user/import');
		expect(response.status === 200);
	});
});
