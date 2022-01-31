import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Request } from 'express';
import request from 'supertest';
import { MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import {
	cleanupCollections,
	importUserFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { UserImportPermissions } from '@src/modules/user-import/constants';
import { ICurrentUser, ImportUser, MatchCreator, School, User } from '@shared/domain';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import {
	ImportUserListResponse,
	ImportUserResponse,
	MatchCreatorResponse,
	UpdateMatchParams,
	UserMatchListResponse,
	UserMatchResponse,
} from '@src/modules/user-import/controller/dto';
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
			const expectAllUserMatchResponsePropertiesExist = (match?: UserMatchResponse, withMatch = true) => {
				expect(match).toBeDefined();
				expect(match?.userId).toEqual(expect.any(String));
				expect(match?.firstName).toEqual(expect.stringMatching('John'));
				expect(match?.lastName).toEqual(expect.stringMatching('Doe'));
				expect(match?.loginName).toEqual(expect.stringMatching('user-'));
				expect(match?.roleNames).toEqual(expect.any(Array));
				expect(match?.roleNames.length).toBeGreaterThanOrEqual(1);
				if (withMatch === true) {
					expect(['admin', 'auto']).toContain(match?.matchedBy);
				}
			};
			const expectAllImportUserResponsePropertiesExist = (data: ImportUserResponse, matchExists: boolean) => {
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
					expectAllUserMatchResponsePropertiesExist(data.match, true);
				} else {
					expect(data.match).toBeUndefined();
				}
			};
			describe('find', () => {
				let user: User;
				let school: School;
				beforeEach(async () => {
					await cleanupCollections(em);

					({ user, school } = await authenticatedUser([UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]));

					currentUser = mapUserToCurrentUser(user);
				});

				describe('[findAllUnmatchedUsers]', () => {
					describe('[GET] user/import/unassigned', () => {
						it('should respond with users of own school', async () => {
							const otherSchoolsUser = userFactory.build();
							const currentSchoolsUser = userFactory.build({ school });
							await em.persistAndFlush([otherSchoolsUser, currentSchoolsUser]);
							em.clear();
							const response = await request(app.getHttpServer()).get('/user/import/unassigned').expect(200);
							const listResponse = response.body as UserMatchListResponse;
							expect(listResponse.data.some((elem) => elem.userId === currentSchoolsUser.id)).toEqual(true);
						});
						it('should not respond with assigned users', async () => {
							const otherSchoolsUser = userFactory.build();
							const currentSchoolsUser = userFactory.build({ school });
							const importUser = importUserFactory.matched(MatchCreator.AUTO, currentSchoolsUser).build({ school });
							await em.persistAndFlush([otherSchoolsUser, currentSchoolsUser, importUser]);
							em.clear();
							const response = await request(app.getHttpServer()).get('/user/import/unassigned').expect(200);
							const listResponse = response.body as UserMatchListResponse;
							expect(listResponse.data.some((elem) => elem.userId === currentSchoolsUser.id)).toEqual(false);
						});
						it('should respond userMatch with all properties', async () => {
							const currentSchoolsUser = userFactory.withRole('teacher').build({
								school,
							});
							await em.persistAndFlush([currentSchoolsUser]);
							em.clear();
							const response = await request(app.getHttpServer()).get('/user/import/unassigned').expect(200);
							const listResponse = response.body as UserMatchListResponse;
							expectAllUserMatchResponsePropertiesExist(listResponse.data[0], false);
						});

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
					it('should return importUsers of current school', async () => {
						const otherSchoolsImportUser = importUserFactory.build();
						const currentSchoolsImportUser = importUserFactory.build({
							school,
						});
						await em.persistAndFlush([otherSchoolsImportUser, currentSchoolsImportUser]);
						em.clear();
						const response = await request(app.getHttpServer()).get('/user/import').expect(200);
						const listResponse = response.body as ImportUserListResponse;
						expect(listResponse.data.some((elem) => elem.importUserId === currentSchoolsImportUser.id)).toEqual(true);
						expect(listResponse.data.some((elem) => elem.importUserId === otherSchoolsImportUser.id)).toEqual(false);
						expectAllImportUserResponsePropertiesExist(listResponse.data[0], false);
					});
					it('should return importUsers with all properties', async () => {
						const otherSchoolsImportUser = importUserFactory.build();
						const userMatch = userFactory.withRole('teacher').build({ school });
						const currentSchoolsImportUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({ school });
						await em.persistAndFlush([otherSchoolsImportUser, currentSchoolsImportUser]);
						em.clear();
						const response = await request(app.getHttpServer()).get('/user/import').expect(200);
						const listResponse = response.body as ImportUserListResponse;
						expect(listResponse.data.some((elem) => elem.importUserId === currentSchoolsImportUser.id)).toEqual(true);
						expect(listResponse.data.some((elem) => elem.importUserId === otherSchoolsImportUser.id)).toEqual(false);
						expectAllImportUserResponsePropertiesExist(listResponse.data[0], true);
					});

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
						it('should set a manual match', async () => {
							const userToBeMatched = userFactory.withRole('student').build({
								school,
							});
							const unmatchedImportUser = importUserFactory.build({
								school,
							});
							await em.persistAndFlush([userToBeMatched, unmatchedImportUser]);
							em.clear();
							const params: UpdateMatchParams = { userId: userToBeMatched.id };
							const result = await request(app.getHttpServer())
								.patch(`/user/import/${unmatchedImportUser.id}/match`)
								.send(params)
								.expect(200);
							const importUserResponse = result.body as ImportUserResponse;
							expectAllImportUserResponsePropertiesExist(importUserResponse, true);
							expect(importUserResponse.match?.matchedBy).toEqual(MatchCreatorResponse.MANUAL);
							expect(importUserResponse.match?.userId).toEqual(userToBeMatched.id);
						});
						it('should update an existing auto match to manual', async () => {
							const userMatch = userFactory.withRole('student').build({
								school,
							});
							const manualUserMatch = userFactory.withRole('student').build({
								school,
							});
							const alreadyMatchedImportUser = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({
								school,
							});
							await em.persistAndFlush([userMatch, alreadyMatchedImportUser]);
							em.clear();
							const params: UpdateMatchParams = { userId: manualUserMatch.id };
							const result = await request(app.getHttpServer())
								.patch(`/user/import/${alreadyMatchedImportUser.id}/match`)
								.send(params)
								.expect(200);
							const elem = result.body as ImportUserResponse;
							expectAllImportUserResponsePropertiesExist(elem, true);
							expect(elem.match?.matchedBy).toEqual(MatchCreatorResponse.MANUAL);
							expect(elem.match?.userId).toEqual(manualUserMatch.id);
						});
					});
				});

				describe('[removeMatch]', () => {
					describe('[DELETE] user/import/:id/match', () => {
						it('should remove a match', async () => {
							const userMatch = userFactory.withRole('student').build({
								school,
							});
							const importUserWithMatch = importUserFactory.matched(MatchCreator.AUTO, userMatch).build({
								school,
							});
							await em.persistAndFlush([importUserWithMatch]);
							em.clear();
							const result = await request(app.getHttpServer())
								.delete(`/user/import/${importUserWithMatch.id}/match`)
								.expect(200);
							expectAllImportUserResponsePropertiesExist(result.body as ImportUserResponse, false);
						});
						it('should not fail when importuser is not having a match', async () => {
							const importUserWithMatch = importUserFactory.build({
								school,
							});
							await em.persistAndFlush([importUserWithMatch]);
							em.clear();
							const result = await request(app.getHttpServer())
								.delete(`/user/import/${importUserWithMatch.id}/match`)
								.expect(200);
							expectAllImportUserResponsePropertiesExist(result.body as ImportUserResponse, false);
						});
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
