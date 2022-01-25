import { Test, TestingModule } from '@nestjs/testing';
import { NewsTargetModel } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ImportUserRepo, UserRepo } from '@shared/repo';
import { userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { UserImportUc } from './user-import.uc';

describe('[ImportUserModule]', () => {
	describe('UserUc', () => {
		let module: TestingModule;
		let uc: UserImportUc;
		let userRepo: UserRepo;
		let importUserRepo: ImportUserRepo;
		let authorizationService: AuthorizationService;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [MongoMemoryDatabaseModule.forRoot()],
				providers: [
					UserImportUc,
					UserRepo,
					ImportUserRepo,
					{
						provide: AuthorizationService,
						useValue: {
							checkEntityPermissions(
								userId: string,
								targetModel: NewsTargetModel,
								targetId: string,
								permissions: string[]
							): Promise<void> {
								throw new Error();
							},
						} as Pick<AuthorizationService, 'checkEntityPermissions'>,
					},
				],
			}).compile();

			uc = module.get(UserImportUc); // TODO UserRepo not available in UserUc?!
			userRepo = module.get(UserRepo);
			importUserRepo = module.get(ImportUserRepo);
			authorizationService = module.get(AuthorizationService);
		});

		afterAll(async () => {
			await module.close();
		});

		it('should be defined', () => {
			expect(uc).toBeDefined();
			expect(userRepo).toBeDefined();
			expect(importUserRepo).toBeDefined();
			expect(authorizationService).toBeDefined();
		});

		describe('When list unassigned users from users school', () => {
			it('Should request authorization service', async () => {
				const user = userFactory.buildWithId();
				const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const authorizationSpy = jest.spyOn(authorizationService, 'checkEntityPermissions').mockResolvedValueOnce();
				const userRepoFindUnmatchedSpy = jest.spyOn(userRepo, 'findWithoutImportUser').mockResolvedValueOnce([]);
				const query = {};
				const result = await uc.findAllUnmatchedUsers(user.id, query);
				expect(authorizationSpy).toBeCalled();
				expect(result.length).toEqual(0);
				userRepoByIdSpy.mockRestore();
				authorizationSpy.mockRestore();
				userRepoFindUnmatchedSpy.mockRestore();
			});
		});
	});
});
