import { AuthorizationService } from '@modules/authorization';
import { System, SystemService } from '@modules/system';
import { UserLoginMigrationDO, UserLoginMigrationService } from '@modules/user-login-migration';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ImportUser } from '../entity';
import { UserLoginMigrationNotActiveLoggableException, UserMigrationIsNotEnabledLoggableException } from '../loggable';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';
import { USER_IMPORT_CONFIG_TOKEN, UserImportConfig } from '../user-import-config';

@Injectable()
export class PopulateUserImportFetchUc {
	constructor(
		@Inject(USER_IMPORT_CONFIG_TOKEN) private readonly config: UserImportConfig,
		private readonly schulconnexFetchImportUsersService: SchulconnexFetchImportUsersService,
		private readonly authorizationService: AuthorizationService,
		private readonly userImportService: UserImportService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly systemService: SystemService
	) {}

	public async populateImportUsers(currentUserId: EntityId, matchByPreferredName = false): Promise<void> {
		this.checkFeatureEnabled(currentUserId);

		const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
		this.authorizationService.checkAllPermissions(user, [Permission.IMPORT_USER_MIGRATE]);

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			user.school.id
		);

		if (!userLoginMigration || userLoginMigration?.closedAt) {
			throw new UserLoginMigrationNotActiveLoggableException(user.school.id);
		}

		const system: System = await this.systemService.findByIdOrFail(userLoginMigration.targetSystemId);
		const fetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.getData(user.school, system);

		const filteredFetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.filterAlreadyMigratedUser(
			fetchedData,
			system
		);

		const matchedImportUsers: ImportUser[] = await this.userImportService.matchUsers(
			filteredFetchedData,
			userLoginMigration,
			matchByPreferredName
		);

		await this.userImportService.deleteImportUsersBySchool(user.school);

		await this.userImportService.saveImportUsers(matchedImportUsers);
	}

	private checkFeatureEnabled(currentUserId: EntityId): void {
		if (!this.config.featureUserMigrationEnabled) {
			throw new UserMigrationIsNotEnabledLoggableException(currentUserId);
		}
	}
}
