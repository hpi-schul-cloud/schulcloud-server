import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, Counted, ImportUser, IImportUserScope, MatchCreator } from '@shared/domain';

import { UserImportPermissions } from '../constants';
import { ImportUserAuthorizationService } from '../provider/import-user.authorization.service';
import { ImportUserRepo } from '../repo';
import { UserRepo } from '../repo/user.repo';

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

		const countedImportUsers = await this.importUserRepo.findImportUsers(user.school, query, options);
		return countedImportUsers;
	}

	async setMatch(currentUserId: EntityId, importUserId: EntityId, userId: EntityId) {
		const currentUser = await this.userRepo.findById(currentUserId);
		const permissions = [
			UserImportPermissions.UPDATE_IMPORT_USER, // update import user match
			UserImportPermissions.STUDENT_LIST, // read other users
			UserImportPermissions.TEACHER_LIST, // read other users
		];
		await this.authorizationService.checkUserHasSchoolPermissions(currentUser, permissions);

		const userMatch = await this.userRepo.findOneByIdAndSchoolOrFail(userId, currentUser.school);
		// todo check permission "list"

		const importUser = await this.importUserRepo.findOneByIdAndSchoolOrFail(importUserId, currentUser.school);
		// todo check permission update

		// check user is not already assigned
		const hasMatch = await this.importUserRepo.hasMatch(userMatch);
		// todo same school in entity setMatch?
		if (hasMatch !== null) throw new Error('remove other assignments of this user first'); // TODO business error
		importUser.setMatch(userMatch, MatchCreator.MANUAL);
		await this.importUserRepo.persistAndFlush(importUser);
		return importUser;
	}

	removeMatch(userId: string, importUserId: string) {
		throw new Error('Method not implemented.');
	}

	setFlag(userId: string, importUserId: string, flagged: boolean) {
		throw new Error('Method not implemented.');
	}
}
