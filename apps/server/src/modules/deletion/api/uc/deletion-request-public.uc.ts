import { LegacyLogger } from '@core/logger';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ICurrentUser } from '@infra/auth-guard';
import { AccountService } from '@modules/account';
import { AuthenticationService } from '@modules/authentication';
import { AuthorizationService } from '@modules/authorization';
import { UserService } from '@modules/user';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { DeletionRequestService } from '../../domain/service';
import { DeletionRequestResponse } from '../controller/dto';
import { DomainName } from '../../domain/types';
import { RoleName } from '@modules/role';

@Injectable()
export class DeletionRequestPublicUc {
	constructor(
		private readonly deletionRequestService: DeletionRequestService,
		private readonly logger: LegacyLogger,
		private readonly accountService: AccountService,
		private readonly userService: UserService,
		private readonly authService: AuthorizationService,
		private readonly authenticationService: AuthenticationService
	) {
		this.logger.setContext(DeletionRequestPublicUc.name);
	}

	public async createUserListDeletionRequest(currentUser: ICurrentUser, ids: EntityId[]): Promise<Error[]> {
		this.logger.debug({ action: 'createDeletionRequestAsUser', ids, userId: currentUser.userId });

		const user = await this.authService.getUserWithPermissions(currentUser.userId);
		this.authService.checkAllPermissions(user, [Permission.STUDENT_DELETE, Permission.TEACHER_DELETE]);

		const deleteAfter = new Date();

		const results = await Promise.allSettled(
			ids.map((targetUserId) => this.createSingleUserDeletionRequest(targetUserId, deleteAfter, currentUser.schoolId))
		);

		const errors: Error[] = results
			.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
			.map((result, index) => {
				const error = result.reason as Error;
				this.logger.error({
					action: 'createSingleUserDeletionRequest',
					userId: currentUser.userId,
					targetUserId: ids[index],
					error: error.message,
				});
				return error;
			});

		return errors;
	}

	private async createSingleUserDeletionRequest(
		targetRefId: EntityId,
		deleteAfter: Date,
		schoolId: EntityId
	): Promise<DeletionRequestResponse> {
		const targetUser = await this.userService.findById(targetRefId);

		if (targetUser.roles.every((role) => role.name !== RoleName.STUDENT && role.name !== RoleName.TEACHER)) {
			throw new ForbiddenException('Cannot request deletion for user with invalid role');
		}

		if (targetUser.schoolId !== schoolId) {
			throw new ForbiddenException('Cannot request deletion for user from different school');
		}

		const result: DeletionRequestResponse = await this.deletionRequestService.createDeletionRequest(
			targetRefId,
			DomainName.USER,
			deleteAfter
		);

		const deleteAt = new Date();
		try {
			await this.accountService.deactivateAccount(targetRefId, deleteAt);
		} catch (error) {
			// it can be the user has no account (either deleted or never finished the registration process)
			this.logger.error({
				action: 'deactivateAccount',
				userId: targetRefId,
				error: (error as Error).message,
			});
		}

		await this.userService.flagAsDeleted(targetRefId, deleteAt);
		await this.authenticationService.removeUserFromWhitelist(targetRefId);

		return result;
	}
}
