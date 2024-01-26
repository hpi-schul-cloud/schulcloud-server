import { AuthorizationService } from '@modules/authorization';
import { Inject, Injectable } from '@nestjs/common';
import { ImportUser, SystemEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import { UserMigrationIsNotEnabledLoggableException } from '../loggable/user-migration-not-enable-loggable-exception';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';

@Injectable()
export class UserImportFetchUc {
	constructor(
		@Inject(UserImportFeatures) private readonly userImportFeatures: IUserImportFeatures,
		private readonly schulconnexFetchImportUsersService: SchulconnexFetchImportUsersService,
		private readonly authorizationService: AuthorizationService,
		private readonly userImportService: UserImportService
	) {}

	public async populateImportUsers(currentUserId: EntityId): Promise<void> {
		this.checkMigrationEnabled(currentUserId);

		const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
		this.authorizationService.checkAllPermissions(user, [Permission.SCHOOL_IMPORT_USERS_MIGRATE]);

		const system: SystemEntity = await this.userImportService.getMigrationSystem();
		const fetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.getData(user.school, system);

		const filteredFetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.filterAlreadyMigratedUser(
			fetchedData,
			this.userImportFeatures.userMigrationSystemId
		);

		const matchedImportUsers: ImportUser[] = await this.userImportService.matchUsers(filteredFetchedData);

		await this.userImportService.saveImportUsers(matchedImportUsers);
	}

	private checkMigrationEnabled(userId: EntityId): void {
		if (!this.userImportFeatures.userMigrationEnabled || !this.userImportFeatures.userMigrationSystemId) {
			throw new UserMigrationIsNotEnabledLoggableException(userId);
		}
	}
}
