import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, User, INameMatch } from '@shared/domain';
import { UserRepo } from '@shared/repo';

import { UserImportPermissions } from '../constants';
import { ImportUserAuthorizationService } from '../services/import-user.authorization.service';

@Injectable()
export class UserUC {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly authorizationService: ImportUserAuthorizationService
	) {}

	/**
	 * Returns a list of users wich is not assigned as match to importusers.
	 * The result will filter by curernt users school by default.
	 * The current user must have permission to read schools users and view importusers.
	 * @param userId current users id
	 * @param query filters
	 * @param options
	 * @returns
	 */
	async findAllUnmatched(userId: EntityId, query: INameMatch, options?: IFindOptions<User>): Promise<User[]> {
		const user = await this.userRepo.findById(userId);

		const permissions = [
			UserImportPermissions.VIEW_IMPORT_USER,
			UserImportPermissions.STUDENT_LIST,
			UserImportPermissions.TEACHER_LIST,
		];
		await this.authorizationService.checkUserHasSchoolPermissions(user, permissions);

		const unmatchedUsers = await this.userRepo.findWithoutImportUser(user.school, query, options);
		return unmatchedUsers;
	}
}
