import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { UserRepo } from '@shared/repo';
import { userFactory } from '@shared/testing';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserImportPermissions } from '../constants';
import { ImportUserAuthorizationService } from '../services/import-user.authorization.service';
import { UserUC } from './user.uc';

describe('[ImportUserModule]', () => {
	describe('UserUc', () => {
		let module: TestingModule;
		let service: UserUC;
		let userRepo: UserRepo;
		let authorizationService: ImportUserAuthorizationService;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [MongoMemoryDatabaseModule.forRoot(), AuthorizationModule],
				providers: [UserUC, ImportUserAuthorizationService, UserRepo],
			}).compile();

			service = module.get(UserUC);
			userRepo = module.get(UserRepo);
			authorizationService = module.get(ImportUserAuthorizationService);
		});

		afterAll(async () => {
			await module.close();
		});

		describe('When list unassigned users from users school', () => {
			it('Should request read permissions for student, teachers and import users of current user', async () => {
				const user = userFactory.build();
				await userRepo.persistAndFlush(user);
				const userRepoSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const authorizationSpy = jest
					.spyOn(authorizationService, 'checkUserHasSchoolPermissions')
					.mockResolvedValueOnce();
				const query = {};
				const result = await service.findAllUnmatched(user.id, query);
				expect(userRepoSpy).toBeCalledWith('userId');
				expect(authorizationSpy).toBeCalledWith(user, [
					UserImportPermissions.VIEW_IMPORT_USER,
					UserImportPermissions.STUDENT_LIST,
					UserImportPermissions.TEACHER_LIST,
				]);
				expect(result.length).toEqual(0);
				userRepoSpy.mockRestore();
				authorizationSpy.mockRestore();
			});
		});
	});
});
