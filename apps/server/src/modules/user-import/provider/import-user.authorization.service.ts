import { Injectable } from '@nestjs/common';
import { NewsTargetModel, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { UserImportPermissions } from '../constants';

@Injectable()
export class ImportUserAuthorizationService {
	constructor(private readonly authorizationService: AuthorizationService) {}

	/**
	 * resolves with schools the given user has all the defined permissions given.
	 */
	async checkUserHasSchoolPermissions(user: User, permissions: UserImportPermissions[]): Promise<void> {
		await this.authorizationService.checkEntityPermissions(
			user.id,
			NewsTargetModel.School,
			user.school.id,
			permissions
		);
	}
}
