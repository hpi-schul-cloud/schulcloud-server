import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, Counted, ImportUser, IImportUserScope, School } from '@shared/domain';

import { ImportUserRepo, UserRepo } from '@shared/repo';
import { UserImportPermissions } from '../constants';
import { ImportUserAuthorizationService } from '../provider/import-user.authorization.service';

@Injectable()
export class UserImportUC {
	constructor(
		private readonly importUserRepo: ImportUserRepo,
		private readonly userRepo: UserRepo,
		private readonly authorizationService: ImportUserAuthorizationService
	) {}

	async findAll(
		userId: EntityId,
		query: IImportUserScope,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const user = await this.userRepo.findById(userId);

		const permissions = [UserImportPermissions.VIEW_IMPORT_USER];
		await this.authorizationService.checkUserHasSchoolPermissions(user, permissions);

		const countedImportUsers = this.importUserRepo.findImportUsers(user.school, query, options);
		return countedImportUsers;
	}
}
