import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { importUserFactory, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { UserImportPermissions } from '@src/modules/user-import/constants';
import { ICurrentUser, ImportUser, NewsTargetModel } from '@shared/domain';
import { E2eTestApi } from '@shared/testing/e2e-test-api';
import { ImportUserListResponse } from '@src/modules/user-import/controller/dto';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';

describe('ImportUser Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: E2eTestApi<ImportUserListResponse>;
	const school = schoolFactory.build();

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
			.overrideProvider(AuthorizationService)
			.useValue({
				checkEntityPermissions(
					userId: string,
					targetModel: NewsTargetModel,
					targetId: string,
					permissions: string[]
				): Promise<void> {
					throw new UnauthorizedException();
				},
			} as Pick<AuthorizationService, 'checkEntityPermissions'>)
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

	const authenticatedUser = async (permissions: UserImportPermissions[]) => {
		const roles = [
			roleFactory.build({
				permissions,
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
	describe('[GET] /user/import', () => {
		let importusers: ImportUser[];
		beforeAll(async () => {
			importusers = importUserFactory.buildList(10, { school });
			await em.persistAndFlush(importusers);
		});

		afterAll(async () => {
			await em.removeAndFlush(importusers);
		});

		it('should fail without permission', async () => {
			const user = await authenticatedUser([]);
			currentUser = mapUserToCurrentUser(user);
			const response = await api.get();
			expect(response.status).toEqual(401);
			expect(response.result.data).toBeUndefined();
		});

		it('should succeed for users with permission VIEW_SCHOOLS_IMPORT_USERS', async () => {
			const user = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]);
			currentUser = mapUserToCurrentUser(user);
			const response = await api.get();
			expect(response.status).toEqual(418);
			expect(response.result.data).toHaveLength(10);
		});
	});
});
