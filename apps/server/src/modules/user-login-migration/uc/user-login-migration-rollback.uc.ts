import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationRollbackService } from '../service';

@Injectable()
export class UserLoginMigrationRollbackUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly userLoginMigrationRollbackService: UserLoginMigrationRollbackService
	) {}

	public async rollbackUser(currentUserId: EntityId, targetUserId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);
		this.authorizationService.checkAllPermissions(user, [Permission.USER_LOGIN_MIGRATION_ROLLBACK]);

		await this.userLoginMigrationRollbackService.rollbackUser(targetUserId);
	}
}
