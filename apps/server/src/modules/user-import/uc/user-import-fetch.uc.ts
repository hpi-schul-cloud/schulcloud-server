import { AuthorizationService } from '@modules/authorization';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportUser, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserMigrationIsNotEnabledLoggableException } from '../loggable';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';
import { UserImportConfig } from '../user-import-config';

@Injectable()
export class UserImportFetchUc {
	constructor(
		private readonly configService: ConfigService<UserImportConfig, true>,
		private readonly schulconnexFetchImportUsersService: SchulconnexFetchImportUsersService,
		private readonly authorizationService: AuthorizationService,
		private readonly userImportService: UserImportService
	) {}

	public async populateImportUsers(currentUserId: EntityId): Promise<void> {
		this.checkMigrationEnabled(currentUserId);

		const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
		this.authorizationService.checkAllPermissions(user, [Permission.IMPORT_USER_MIGRATE]);

		const system: System = await this.userImportService.getMigrationSystem();
		const fetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.getData(user.school, system);

		const filteredFetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.filterAlreadyMigratedUser(
			fetchedData,
			this.configService.get('FEATURE_USER_MIGRATION_SYSTEM_ID')
		);

		const matchedImportUsers: ImportUser[] = await this.userImportService.matchUsers(filteredFetchedData);

		await this.userImportService.deleteImportUsersBySchool(user.school);

		await this.userImportService.saveImportUsers(matchedImportUsers);
	}

	private checkMigrationEnabled(userId: EntityId): void {
		if (
			!this.configService.get('FEATURE_USER_MIGRATION_ENABLED') ||
			!this.configService.get('FEATURE_USER_MIGRATION_SYSTEM_ID')
		) {
			throw new UserMigrationIsNotEnabledLoggableException(userId);
		}
	}
}
