import { SanisResponse } from '@infra/schulconnex-client';
import { AuthorizationService } from '@modules/authorization';
import { Inject, Injectable } from '@nestjs/common';
import { ImportUser, SystemEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import {
	UserMigrationIsNotEnabledLoggableException,
	UserImportSchoolExternalIdMissingLoggableException,
} from '../loggable';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';

@Injectable()
export class UserImportFetchUc {
	constructor(
		@Inject(UserImportFeatures) private readonly userImportFeatures: IUserImportFeatures,
		private readonly schulconnexFetchImportUsersService: SchulconnexFetchImportUsersService,
		private readonly authorizationService: AuthorizationService,
		private readonly userImportService: UserImportService
	) {}

	public async fetchImportUsers(currentUserId: EntityId): Promise<void> {
		this.checkMigrationEnabled(currentUserId);

		const currentUser: User = await this.getUserAndCheckPermissions(currentUserId);

		const { externalId } = currentUser.school;
		if (!externalId) {
			throw new UserImportSchoolExternalIdMissingLoggableException(currentUserId);
		}

		const fetchedData: SanisResponse[] = await this.schulconnexFetchImportUsersService.getData({
			externalSchoolId: externalId,
		});

		const filteredFetchedData: SanisResponse[] = this.schulconnexFetchImportUsersService.filterAlreadyFetchedData(
			fetchedData,
			this.userImportFeatures.userMigrationSystemId
		);

		const system: SystemEntity = await this.userImportService.getMigrationSystem();
		const mappedImportUsers: ImportUser[] = this.schulconnexFetchImportUsersService.mapDataToUserImportEntities(
			filteredFetchedData,
			system,
			currentUser.school
		);

		// TODO: do matching

		await this.userImportService.saveImportUsers(mappedImportUsers);
	}

	private checkMigrationEnabled(userId: EntityId): void {
		if (!this.userImportFeatures.userMigrationEnabled || !this.userImportFeatures.userMigrationSystemId) {
			throw new UserMigrationIsNotEnabledLoggableException(userId);
		}
	}

	private async getUserAndCheckPermissions(userId: EntityId): Promise<User> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.SCHOOL_IMPORT_USERS_VIEW]);

		return user;
	}
}
