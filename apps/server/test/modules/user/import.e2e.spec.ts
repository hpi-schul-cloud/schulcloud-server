import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Request } from 'express';
import request from 'supertest';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { importUserFactory, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { UserImportPermissions } from '@src/modules/user-import/constants';
import { ICurrentUser, ImportUser, MatchCreator, School, User } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { ImportUserResponse, UpdateMatchParams } from '@src/modules/user-import/controller/dto';
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
					const userMatch = userFactory.build({ school });
					const importUser = importUserFactory.build({ school });
					await em.persistAndFlush([userMatch, importUser]);
					em.clear();
					const params: UpdateMatchParams = { userId: user.id };
					await request(app.getHttpServer()).patch(`/user/import/${importUser.id}/match`).send(params).expect(200);
				});
				it('DELETE /user/import/:id/match is allowed', async () => {
					const userMatch = userFactory.build({ school });
					const importUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({ school });
					await em.persistAndFlush([userMatch, importUser]);
					em.clear();
					await request(app.getHttpServer()).delete(`/user/import/${importUser.id}/match`).send().expect(200);
				});
				it('PATCH /user/import/:id/flag is allowed', async () => {
					const importUser = importUserFactory.build({ school });
					await em.persistAndFlush(importUser);
					em.clear();
					const params: UpdateFlagParams = { flagged: true };
					await request(app.getHttpServer()).patch(`/user/import/${importUser.id}/flag`).send(params).expect(200);
				});
			});
		});

		describe('Business Errors', () => {
			let user: User;
			let school: School;
			beforeEach(async () => {
				({ user, school } = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]));
				currentUser = mapUserToCurrentUser(user);
			});
			describe('[setMatch]', () => {
				describe('When set a match on import user', () => {
					it('should fail for different school of match- and import-user', async () => {
						const importUser = importUserFactory.build({ school });
						const otherSchool = schoolFactory.build();
						const userMatch = userFactory.build({ school: otherSchool });
						await em.persistAndFlush([userMatch, importUser]);
						em.clear();
						const params: UpdateMatchParams = { userId: userMatch.id };
						await request(app.getHttpServer()).patch(`/user/import/${importUser.id}/match`).send(params).expect(403);
					});
					it('should fail for different school of current-/authenticated- and import-user', async () => {
						const otherSchool = schoolFactory.build();
						const importUser = importUserFactory.build({ school: otherSchool });
						const userMatch = userFactory.build({ school: otherSchool });
						await em.persistAndFlush([userMatch, importUser]);
						em.clear();
						const params: UpdateMatchParams = { userId: userMatch.id };
						await request(app.getHttpServer()).patch(`/user/import/${importUser.id}/match`).send(params).expect(403);
					});
				});

				describe('When set a match with a single user twice', () => {
					it('should fail', async () => {
						const userMatch = userFactory.build({ school });
						const importUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({ school });
						const unmatchedImportUser = importUserFactory.build({ school });
						await em.persistAndFlush([userMatch, importUser]);
						em.clear();
						const params: UpdateMatchParams = { userId: userMatch.id };
						await request(app.getHttpServer())
							.patch(`/user/import/${unmatchedImportUser.id}/match`)
							.send(params)
							.expect(400);
					});
				});
			});
			describe('[removeMatch]', () => {
				describe('When remove a match on import user', () => {
					it('should fail for different school of current- and import-user', async () => {
						const otherSchool = schoolFactory.build();
						const importUser = importUserFactory.build({ school: otherSchool });
						await em.persistAndFlush(importUser);
						em.clear();
						await request(app.getHttpServer()).delete(`/user/import/${importUser.id}/match`).send().expect(403);
					});
				});
			});
			describe('[updateFlag]', () => {
				describe('When change flag on import user', () => {
					it('should fail for different school of current- and import-user', async () => {
						const otherSchool = schoolFactory.build();
						const importUser = importUserFactory.build({ school: otherSchool });
						await em.persistAndFlush(importUser);
						em.clear();
						const params: UpdateFlagParams = { flagged: true };
						await request(app.getHttpServer()).patch(`/user/import/${importUser.id}/flag`).send(params).expect(403);
					});
				});
			});
		});

		describe('Acceptance Criteria', () => {
			const expectAllPropertiesExist = (data: ImportUserResponse, matchExists: boolean) => {
				expect(data).toEqual(
					expect.objectContaining({
						importUserId: expect.any(String),
						firstName: expect.stringMatching('John'),
						lastName: expect.stringMatching('Doe'),
						loginName: expect.stringMatching('john'),
						roleNames: expect.any(Array),
						classNames: expect.any(Array),
						flagged: expect.any(Boolean),
					} as Partial<Record<keyof ImportUserResponse, unknown>>)
				);
				expect(data.roleNames.length).toBeGreaterThanOrEqual(1);
				expect(data.classNames.length).toBeGreaterThanOrEqual(1);
				if (matchExists === true) {
					expect(data.match).toBeDefined();
					expect(data.match?.userId).toEqual(expect.any(String));
					expect(data.match?.firstName).toEqual(expect.stringMatching('John'));
					expect(data.match?.lastName).toEqual(expect.stringMatching('Doe'));
					expect(data.match?.loginName).toEqual(expect.stringMatching('user-'));
					expect(data.match?.roleNames).toEqual(expect.any(Array));
					expect(data.match?.matchedBy).toEqual(expect.stringMatching(/(admin|auto)/));
					// expect(data.match?.roleNames.length).toBeGreaterThanOrEqual(1); // TODO
				}
			};
			describe('find', () => {
				let user: User;
				let school: School;
				beforeEach(async () => {
					({ user, school } = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]));
					currentUser = mapUserToCurrentUser(user);
				});

				describe('[findAllUnmatchedUsers]', () => {
					describe('[GET] user/import/unassigned', () => {
						it.skip('should respond with users of own school', async () => {
							const otherSchoolImportUser = importUserFactory.build();
							const thisSchoolImportUser = importUserFactory.build({ school });
							await em.persistAndFlush([otherSchoolImportUser, thisSchoolImportUser]);
							em.clear();
						});
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
				describe('[findAllImportUsers]', () => {
					it('should return importUsers of current school', async () => {});
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
			});
			describe('updates', () => {
				let user: User;
				let school: School;
				beforeEach(async () => {
					({ user, school } = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]));
					currentUser = mapUserToCurrentUser(user);
				});

				describe('[setMatch]', () => {
					describe('[PATCH] user/import/:id/match', () => {
						it('should set a match', async () => {
							const userMatch = userFactory.build({
								school,
								roles: roleFactory.buildList(1, { name: 'teacher' }),
							});
							const unmatchedImportUser = importUserFactory.build({ school, classNames: ['firstClass', 'otherClass'] });
							await em.persistAndFlush([userMatch, unmatchedImportUser]);
							em.clear();
							const params: UpdateMatchParams = { userId: userMatch.id };
							const result = await request(app.getHttpServer())
								.patch(`/user/import/${unmatchedImportUser.id}/match`)
								.send(params)
								.expect(200);
							expectAllPropertiesExist(result.body as ImportUserResponse, true);
						});
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
			});
		});
	});
});
