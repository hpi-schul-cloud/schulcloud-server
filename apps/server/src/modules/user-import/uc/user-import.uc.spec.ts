import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import { MatchCreator, PermissionService } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ImportUserRepo, UserRepo } from '@shared/repo';
import { importUserFactory, schoolFactory, userFactory } from '@shared/testing';
import { UserImportPermissions } from '../constants';
import { UserImportUc } from './user-import.uc';

describe('[ImportUserModule]', () => {
	describe('UserUc', () => {
		let module: TestingModule;
		let uc: UserImportUc;
		let userRepo: UserRepo;
		let importUserRepo: ImportUserRepo;
		let permissionService: PermissionService;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [MongoMemoryDatabaseModule.forRoot()],
				providers: [
					UserImportUc,
					UserRepo,
					ImportUserRepo,
					{
						provide: PermissionService,
						useValue: {
							checkUserHasAllSchoolPermissions(): Promise<void> {
								throw new Error();
							},
						},
					},
				],
			}).compile();
			uc = module.get(UserImportUc); // TODO UserRepo not available in UserUc?!
			userRepo = module.get(UserRepo);
			importUserRepo = module.get(ImportUserRepo);
			permissionService = module.get(PermissionService);
		});

		afterAll(async () => {
			await module.close();
		});

		it('should be defined', () => {
			expect(uc).toBeDefined();
			expect(userRepo).toBeDefined();
			expect(importUserRepo).toBeDefined();
			expect(permissionService).toBeDefined();
		});

		describe('[findAllImportUsers]', () => {
			it('Should request authorization service', async () => {
				const user = userFactory.buildWithId();
				const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const permissionServiceSpy = jest
					.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
					.mockReturnValue();
				const importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[], 0]);
				const result = await uc.findAllImportUsers(user.id, {}, {});
				expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]);
				expect(importUserRepoFindImportUsersSpy).toHaveBeenCalledWith(user.school, {}, {});
				expect(result[0]).toHaveLength(0);
				expect(result[1]).toEqual(0);
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				importUserRepoFindImportUsersSpy.mockRestore();
			});
		});
		describe('[findAllUnmatchedUsers]', () => {
			it('Should request authorization service', async () => {
				const user = userFactory.buildWithId();
				const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const permissionServiceSpy = jest
					.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
					.mockReturnValue();
				const userRepoFindUnmatchedSpy = jest.spyOn(userRepo, 'findWithoutImportUser').mockResolvedValueOnce([[], 0]);
				const query = {};
				const [result, count] = await uc.findAllUnmatchedUsers(user.id, query);
				expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]);
				expect(result.length).toEqual(0);
				expect(count).toEqual(0);
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				userRepoFindUnmatchedSpy.mockRestore();
			});
		});

		describe('[setMatch]', () => {
			describe('When not having same school for current user, user match and importuser', () => {
				it('should not change match', async () => {
					const school = schoolFactory.buildWithId();
					const user = userFactory.buildWithId();
					const importUser = importUserFactory.buildWithId({ school });
					const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
					const permissionServiceSpy = jest
						.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
						.mockReturnValue();
					const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
					const importUserPersistAndFlushSpy = jest
						.spyOn(importUserRepo, 'persistAndFlush')
						.mockResolvedValueOnce(importUser);

					await expect(async () => uc.setMatch(user.id, importUser.id, user.id)).rejects.toThrowError(
						ForbiddenException
					);
					expect(importUser.flagged).not.toEqual(true);
					userRepoByIdSpy.mockRestore();
					permissionServiceSpy.mockRestore();
					importUserRepoFindByIdSpy.mockRestore();
					importUserPersistAndFlushSpy.mockRestore();
				});
			});
			describe('When having same school for current user, user-match and importuser', () => {
				describe('When not having a user already assigned as match', () => {
					it('should set user as new match', async () => {
						const school = schoolFactory.buildWithId();
						const currentUser = userFactory.buildWithId({ school });
						const usermatch = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest
							.spyOn(userRepo, 'findById')
							.mockResolvedValueOnce(currentUser)
							.mockResolvedValueOnce(usermatch);

						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserRepoHasMatchdSpy = jest.spyOn(importUserRepo, 'hasMatch').mockResolvedValueOnce(null);

						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeUndefined();
						expect(importUser.matchedBy).toBeUndefined();

						await uc.setMatch(currentUser.id, importUser.id, usermatch.id);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
							UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE,
						]);
						expect(importUserRepoHasMatchdSpy).toHaveBeenCalledWith(usermatch);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).toEqual(usermatch);
						expect(importUser.matchedBy).toEqual(MatchCreator.MANUAL);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserRepoHasMatchdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});

				describe('When having a user already assigned as match', () => {
					it('should not set user as new match twice', async () => {
						const school = schoolFactory.buildWithId();
						const currentUser = userFactory.buildWithId({ school });
						const usermatch = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest
							.spyOn(userRepo, 'findById')
							.mockResolvedValueOnce(currentUser)
							.mockResolvedValueOnce(usermatch);

						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const otherImportUser = importUserFactory.buildWithId();
						const importUserRepoHasMatchdSpy = jest
							.spyOn(importUserRepo, 'hasMatch')
							.mockResolvedValueOnce(otherImportUser);

						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeUndefined();
						expect(importUser.matchedBy).toBeUndefined();

						await expect(async () => uc.setMatch(currentUser.id, importUser.id, usermatch.id)).rejects.toThrowError(
							UserAlreadyAssignedToImportUserError
						);
						expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
							UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE,
						]);
						expect(importUserRepoHasMatchdSpy).toHaveBeenCalledWith(usermatch);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).not.toEqual(usermatch);
						expect(importUser.matchedBy).not.toEqual(MatchCreator.MANUAL);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserRepoHasMatchdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
			});
		});

		describe('[setFlag]', () => {
			describe('When having permission UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE', () => {
				describe('When not having same school for user and importuser', () => {
					it('should not change flag', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId();
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						await expect(async () => uc.updateFlag(user.id, importUser.id, true)).rejects.toThrowError(
							ForbiddenException
						);
						expect(importUser.flagged).not.toEqual(true);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
				describe('When having same school for user and importuser', () => {
					it('should enable flag', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						const result = await uc.updateFlag(user.id, importUser.id, true);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(true);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
					it('should disable flag', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						const result = await uc.updateFlag(user.id, importUser.id, false);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(false);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
			});
		});
		describe('[removeMatch]', () => {
			describe('When having permission UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE', () => {
				describe('When having same school for user and importuser', () => {
					it('should revoke match', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId({ school });
						const importUser = importUserFactory.matched(MatchCreator.AUTO, user).buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeDefined();
						expect(importUser.matchedBy).toBeDefined();

						const result = await uc.removeMatch(user.id, importUser.id);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(result.user).toBeUndefined();
						expect(result.matchedBy).toBeUndefined();
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
				describe('When not having same school for user and importuser', () => {
					it('should not revoke match', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId();
						const usermatch = userFactory.buildWithId({ school });
						const importUser = importUserFactory.matched(MatchCreator.AUTO, usermatch).buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeDefined();
						expect(importUser.matchedBy).toBeDefined();

						await expect(async () => uc.removeMatch(user.id, importUser.id)).rejects.toThrowError(ForbiddenException);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).toEqual(usermatch);
						expect(importUser.matchedBy).toEqual(MatchCreator.AUTO);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
			});
		});
	});
});
