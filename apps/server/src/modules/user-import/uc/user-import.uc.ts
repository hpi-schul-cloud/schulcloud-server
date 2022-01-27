import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import {
	EntityId,
	IFindOptions,
	Counted,
	ImportUser,
	IImportUserScope,
	MatchCreator,
	INameMatch,
	User,
	NewsTargetModel,
} from '@shared/domain';

import { ImportUserRepo, UserRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { UserImportPermissions } from '../constants';

@Injectable()
export class UserImportUc {
	constructor(
		private readonly importUserRepo: ImportUserRepo,
		private readonly userRepo: UserRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	/**
	 * Resolves with current users schools importusers and matched users.
	 * @param userId
	 * @param query
	 * @param options
	 * @returns
	 */
	async findAllImportUsers(
		userId: EntityId,
		query: IImportUserScope,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const user = await this.userRepo.findById(userId, true);

		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW];
		await this.authorizationService.checkEntityPermissions(
			user.id,
			NewsTargetModel.School,
			user.school.id,
			permissions
		);

		const countedImportUsers = await this.importUserRepo.findImportUsers(user.school, query, options);
		return countedImportUsers;
	}

	/**
	 * Update a @User reference of an @ImportUser
	 * @param currentUserId
	 * @param importUserId
	 * @param userMatchId
	 * @returns importuser and matched user
	 */
	async setMatch(currentUserId: EntityId, importUserId: EntityId, userMatchId: EntityId) {
		const currentUser = await this.userRepo.findById(currentUserId);
		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE];
		await this.authorizationService.checkEntityPermissions(
			currentUser.id,
			NewsTargetModel.School,
			currentUser.school.id,
			permissions
		);
		const userMatch = await this.userRepo.findById(userMatchId);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (
			!currentUser.school.id ||
			currentUser.school.id !== userMatch.school.id ||
			currentUser.school.id !== importUser.school.id
		) {
			throw new ForbiddenException('not same school');
		}

		// check user is not already assigned
		const hasMatch = await this.importUserRepo.hasMatch(userMatch);
		if (hasMatch !== null) throw new UserAlreadyAssignedToImportUserError();

		importUser.setMatch(userMatch, MatchCreator.MANUAL);
		await this.importUserRepo.persistAndFlush(importUser);

		return importUser;
	}

	async removeMatch(currentUserId: EntityId, importUserId: EntityId) {
		const currentUser = await this.userRepo.findById(currentUserId);
		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE];
		await this.authorizationService.checkEntityPermissions(
			currentUser.id,
			NewsTargetModel.School,
			currentUser.school.id,
			permissions
		);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (currentUser.school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		importUser.revokeMatch();
		await this.importUserRepo.persistAndFlush(importUser);

		return importUser;
	}

	async setFlag(currentUserId: EntityId, importUserId: EntityId, flagged: boolean) {
		const currentUser = await this.userRepo.findById(currentUserId);
		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE];
		await this.authorizationService.checkEntityPermissions(
			currentUser.id,
			NewsTargetModel.School,
			currentUser.school.id,
			permissions
		);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (currentUser.school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		importUser.flagged = flagged === true;
		await this.importUserRepo.persistAndFlush(importUser);

		return importUser;
	}

	/**
	 * Returns a list of users wich is not assigned as match to importusers.
	 * The result will filter by curernt users school by default.
	 * The current user must have permission to read schools users and view importusers.
	 * @param currentUserId
	 * @param query filters
	 * @param options
	 * @returns
	 */
	async findAllUnmatchedUsers(
		currentUserId: EntityId,
		query: INameMatch,
		options?: IFindOptions<User>
	): Promise<User[]> {
		const currentUser = await this.userRepo.findById(currentUserId);

		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW];
		await this.authorizationService.checkEntityPermissions(
			currentUser.id,
			NewsTargetModel.School,
			currentUser.school.id,
			permissions
		);
		const unmatchedUsers = await this.userRepo.findWithoutImportUser(currentUser.school, query, options);
		return unmatchedUsers;
	}
}
