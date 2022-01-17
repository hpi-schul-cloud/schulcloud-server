import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, User, INameMatch } from '@shared/domain';

import { UserImportPermissions } from '../constants';
import { ImportUserAuthorizationService } from '../provider/import-user.authorization.service';
import { UserRepo } from '../repo/user.repo';

@Injectable()
export class UserUC {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly authorizationService: ImportUserAuthorizationService
	) {}

	async findAllUnmatched(userId: EntityId, query: INameMatch, options?: IFindOptions<User>): Promise<User[]> {
		const user = await this.userRepo.findById(userId);

		const permissions = [UserImportPermissions.STUDENT_LIST, UserImportPermissions.TEACHER_LIST];
		await this.authorizationService.checkUserHasSchoolPermissions(user, permissions);

		const countedImportUsers = await this.userRepo.findWithoutImportUser(user.school, query, options);
		return countedImportUsers;
	}
}
