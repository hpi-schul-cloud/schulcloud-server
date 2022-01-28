import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Request } from 'express';
import request from 'supertest';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { importUserFactory, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { UserImportPermissions } from '@src/modules/user-import/constants';
import { ICurrentUser, ImportUser, School, User } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { ImportUserListResponse, UpdateMatchParams } from '@src/modules/user-import/controller/dto';
import { UpdateFlagParams } from '@src/modules/user-import/controller/dto/update-flag.params';

describe('ImportUser Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	const authenticatedUser = async (permissions: UserImportPermissions[] = []) => {
		const school = schoolFactory.build();
		const roles = [roleFactory.build({ name: 'administrator', permissions })];
		await em.persistAndFlush([school, ...roles]);
		const user = userFactory.build({
			school,
			roles,
		});
		await em.persistAndFlush([user]);
		em.clear();
		return { user, roles, school };
	};

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
		orm = app.get(MikroORM);
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

	describe('[GET] /user/import', () => {
		let importusers: ImportUser[];
		beforeAll(async () => {
			const { school } = await authenticatedUser();
			importusers = importUserFactory.buildList(10, { school });
			await em.persistAndFlush(importusers);
		});

		afterAll(async () => {
			await em.removeAndFlush(importusers);
		});

		describe('Generic Errors', () => {
			describe('When authorization is missing', () => {
				let user: User;
				beforeEach(async () => {
					({ user } = await authenticatedUser());
					currentUser = mapUserToCurrentUser(user);
				});
				it('GET /user/import is UNAUTHORIZED', async () => {
					await request(app.getHttpServer()).get('/user/import').expect(401);
				});
				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await request(app.getHttpServer()).get('/user/import/unassigned').expect(401);
				});
				it('PATCH /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateMatchParams = { userId: new ObjectId().toString() };
					await request(app.getHttpServer()).patch(`/user/import/${id}/match`).send(params).expect(401);
				});
				it('DELETE /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					await request(app.getHttpServer()).delete(`/user/import/${id}/match`).send().expect(401);
				});
				it('PATCH /user/import/:id/flag is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateFlagParams = { flagged: true };
					await request(app.getHttpServer()).patch(`/user/import/${id}/flag`).send(params).expect(401);
				});
			});

			describe('When current user has permission UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW', () => {
				let user: User;
				let school: School;
				beforeEach(async () => {
					({ school, user } = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]));
					currentUser = mapUserToCurrentUser(user);
				});
				it('GET /user/import responds with importusers', async () => {
					const usermatch = userFactory.build({ school });
					const importuser = importUserFactory.build({ school });
					await em.persistAndFlush([usermatch, importuser]);
					await request(app.getHttpServer()).get('/user/import').expect(200);
				});
				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await request(app.getHttpServer()).get('/user/import/unassigned').expect(200);
				});
				it('PATCH /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateMatchParams = { userId: new ObjectId().toString() };
					await request(app.getHttpServer()).patch(`/user/import/${id}/match`).send(params).expect(401);
				});
				it('DELETE /user/import/:id/match is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					await request(app.getHttpServer()).delete(`/user/import/${id}/match`).send().expect(401);
				});
				it('PATCH /user/import/:id/flag is UNAUTHORIZED', async () => {
					const id = new ObjectId().toString();
					const params: UpdateFlagParams = { flagged: true };
					await request(app.getHttpServer()).patch(`/user/import/${id}/flag`).send(params).expect(401);
				});
			});
			describe('When current user has permission UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE', () => {
				let user: User;
				let school: School;
				beforeEach(async () => {
					({ user, school } = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]));
					currentUser = mapUserToCurrentUser(user);
				});
				it('GET /user/import is UNAUTHORIZED', async () => {
					const usermatch = userFactory.build({ school });
					const importuser = importUserFactory.build({ school });
					await em.persistAndFlush([usermatch, importuser]);
					em.clear();
					await request(app.getHttpServer()).get('/user/import').expect(401);
				});
				it('GET /user/import/unassigned is UNAUTHORIZED', async () => {
					await request(app.getHttpServer()).get('/user/import/unassigned').expect(401);
				});
				it('PATCH /user/import/:id/match is allowed', async () => {
					const id = new ObjectId().toString();
					const params: UpdateMatchParams = { userId: new ObjectId().toString() };
					await request(app.getHttpServer()).patch(`/user/import/${id}/match`).send(params).expect(200);
				});
				it('DELETE /user/import/:id/match is allowed', async () => {
					const id = new ObjectId().toString();
					await request(app.getHttpServer()).delete(`/user/import/${id}/match`).send().expect(200);
				});
				it('PATCH /user/import/:id/flag is allowed', async () => {
					const id = new ObjectId().toString();
					const params: UpdateFlagParams = { flagged: true };
					await request(app.getHttpServer()).patch(`/user/import/${id}/flag`).send(params).expect(200);
				});
			});
		});

		describe('Business Errors', () => {
			describe('[setMatch]', () => {
				describe('When set a match on import user', () => {
					it.todo('should fail for different school of match- and import-user');
					it.todo('should fail for different school of current- and import-user');
				});

				describe('When set a match with a user twice', () => {
					it.todo('should fail');
				});
			});
			describe('[removeMatch]', () => {
				describe('When remove a match on import user', () => {
					it.todo('should fail for different school of current- and import-user');
				});
			});
			describe('[updateFlag]', () => {
				describe('When remove a match on import user', () => {
					it.todo('should fail for different school of current- and import-user');
				});
			});
		});

		describe('Acceptance Criteria', () => {
			describe('[findAllImportUsers]', () => {
				it.todo('should return importUsers of current school');
				it.todo('should return importUsers as ImportUsersListResponse');
				it.todo('should return importUsers with all properties');

				describe('when use sorting', () => {
					it.todo('should sort by firstname asc');
					it.todo('should sort by firstname desc');
					it.todo('should sort by lastname asc');
					it.todo('should sort by lastname desc');
				});
				describe('when use pagination', () => {
					it.todo('should skip importUsers');
					it.todo('should limit importUsers');
					it.todo('should have total higher than current page');
				});

				describe('when apply filters', () => {
					it.todo('should filter by firstname');
					it.todo('should filter by lastname');
					it.todo('should filter by username');
					it.todo('should filter by one role of student, teacher, or admin');
					it.todo('should filter by class');
					it.todo('should filter by match type none');
					it.todo('should filter by match type admin');
					it.todo('should filter by match type auto');
					it.todo('should filter by multiple match types');
					it.todo('should filter by flag enabled');
				});
			});

			describe('[setMatch]', () => {
				describe('[PATCH] user/import/:id/match', () => {
					it.todo('should set a match');
					it.todo('should update an existing match');
					it.todo('should respond importUser with all properties');
					it.todo('should respond importUser with MANUAL match type');
				});
			});

			describe('[removeMatch]', () => {
				describe('[DELETE] user/import/:id/match', () => {
					it.todo('should remove a match');
					it.todo('should not fail when importuser is not having a match');
					it.todo('should not fail when removing matches multiple times from different import users'); // TODO
					it.todo('should respond importUser with all properties');
				});
			});
			describe('[updateFlag]', () => {
				describe('[PATCH] user/import/:id/flag', () => {
					it.todo('should add a flag');
					it.todo('should remove a flag');
					it.todo('should respond importUser with all properties');
				});
			});

			describe('[findAllUnmatchedUsers]', () => {
				describe('[GET] user/import/unassigned', () => {
					it.todo('should respond with users of own school');
					it.todo('should not respond with assigned users');
					it.todo('should respond userMatch with all properties');

					describe('when use pagination', () => {
						it.todo('should skip users');
						it.todo('should limit users');
						it.todo('should have total higher than current page');
					});

					describe('when apply filters', () => {
						it.todo('should match name in firstname');
						it.todo('should match name in lastname');
					});
				});
			});
		});
	});
});
