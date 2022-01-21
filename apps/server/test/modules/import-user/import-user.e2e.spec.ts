import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { UserImportPermissions } from '@src/modules/user-import/constants';
import { ICurrentUser } from '@shared/domain';
import { E2eTestApi } from '@shared/testing/e2e-test-api';
import { ImportUserListResponse, UserListResponse } from '@src/modules/user-import/controller/dto';

describe('ImportUser Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: E2eTestApi<ImportUserListResponse>;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerModule],
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
		orm = app.get(MikroORM);

		api = new E2eTestApi<ImportUserListResponse>(app, '/user/import');
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

	const authenticatedUser = async () => {
		const school = schoolFactory.build();
		const roles = [
			roleFactory.build({
				permissions: [
					UserImportPermissions.VIEW_SCHOOLS_IMPORT_USERS,
					UserImportPermissions.STUDENT_LIST,
					UserImportPermissions.TEACHER_LIST,
				],
			}),
		];
		const user = userFactory.build({
			school,
			roles,
		});
		await em.persistAndFlush([user]);
		em.clear();
		return user;
	};

	it('[GET] user/import fails without permission', async () => {
		currentUser = mapUserToCurrentUser(userFactory.build());
		const response = await api.get();
		expect(response.status === 401);
	});

	it('[GET] user/import', async () => {
		const user = await authenticatedUser();
		currentUser = mapUserToCurrentUser(user);
		const response = await api.get();
		expect(response.status === 200);
	});
});
