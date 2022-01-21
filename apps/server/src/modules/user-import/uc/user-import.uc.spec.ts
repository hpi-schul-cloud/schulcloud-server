import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { UserRepo } from '@shared/repo';
import { userFactory } from '@shared/testing';
import { AuthorizationModule } from '@src/modules/authorization';
import { ImportUserAuthorizationService } from '../services/import-user.authorization.service';
import { UserImportUc } from './user-import.uc';

describe('[ImportUserModule]', () => {
	describe('UserUc', () => {
		let module: TestingModule;
		let uc: UserImportUc;
		let userRepo: UserRepo;
		let authorizationService: ImportUserAuthorizationService;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [MongoMemoryDatabaseModule.forRoot(), AuthorizationModule],
				providers: [
					UserImportUc,
					ImportUserAuthorizationService,
					UserRepo,
					// {
					// 	provide: UserRepo,
					// 	useValue: {
					// 		findById(id: EntityId) {
					// 			return Promise.resolve(userFactory.buildWithId());
					// 		},
					// 	} as Pick<UserRepo, 'findById' | 'findWithoutImportUser'>,
					// },
				],
			}).compile();

			uc = module.get(UserImportUc); // TODO UserRepo not available in UserUc?!
			userRepo = module.get(UserRepo);
			authorizationService = module.get(ImportUserAuthorizationService);
		});

		afterAll(async () => {
			await module.close();
		});

		it('should be defined', () => {
			expect(uc).toBeDefined();
			expect(userRepo).toBeDefined();
			expect(authorizationService).toBeDefined();
		});

		describe('When list unassigned users from users school', () => {
			it('Should request read permissions for student, teachers and import users of current user', async () => {
				const user = userFactory.build();
				// await userRepo.persistAndFlush(user);
				// const userRepoSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				// const authorizationSpy = jest
				// 	.spyOn(authorizationService, 'checkUserHasSchoolPermissions')
				// 	.mockResolvedValueOnce();
				const query = {};
				expect(userRepo).toBeDefined();
				const result = await uc.findAllUnmatchedUsers(user.id, query);
				// expect(userRepoSpy).toBeCalledWith('userId');
				// expect(authorizationSpy).toBeCalledWith(user, [
				// 	UserImportPermissions.VIEW_IMPORT_USER,
				// 	UserImportPermissions.STUDENT_LIST,
				// 	UserImportPermissions.TEACHER_LIST,
				// ]);
				expect(result.length).toEqual(0);
				// userRepoSpy.mockRestore();
				// authorizationSpy.mockRestore();
			});
		});
	});
});
