import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { importUserFactory, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { UserImportPermissions } from '@src/modules/user-import/constants';
import { ICurrentUser, ImportUser, NewsTargetModel } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { UserApi } from '../../api-client';

describe('ImportUser Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: UserApi;
	const school = schoolFactory.build();

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

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerModule, MongoMemoryDatabaseModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.overrideProvider(AuthorizationService) // remove feathers dependencies
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

		const user = await authenticatedUser([]);
		currentUser = mapUserToCurrentUser(user);
		await app.listen(1234); // TODO dynamic
		const url = await app.getUrl();
		expect(url).toEqual('http://[::1]:1234');
		api = new UserApi(undefined, url); // TODO
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

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
			const response = await api.findAll();
			expect(response.status).toEqual(401);
			expect(response.data).toBeUndefined();
		});

		it('should succeed for users with permission VIEW_SCHOOLS_IMPORT_USERS', async () => {
			const user = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]);
			currentUser = mapUserToCurrentUser(user);
			const response = await api.findAll();
			expect(response.status).toEqual(418);
			expect(response.data).toHaveLength(10);
		});
	});
});
