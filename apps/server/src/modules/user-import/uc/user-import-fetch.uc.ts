import { SanisResponse } from '@infra/schulconnex-client';
import { AuthorizationService } from '@modules/authorization';
import { Inject, Injectable } from '@nestjs/common';
import { ImportUser } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IUserImportFeatures, UserImportFeatures } from '../config';
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
		const currentUser = await this.authorizationService.getUserWithPermissions(currentUserId);
		this.authorizationService.checkAllPermissions(currentUser, [Permission.SCHOOL_IMPORT_USERS_VIEW]);

		const { externalId } = currentUser.school;
		if (!externalId) {
			// TODO: throw loggable exception
		}

		// TODO: remove non-null assertion
		const fetchedData: SanisResponse[] = await this.schulconnexFetchImportUsersService.getData({
			externalSchoolId: externalId!,
		});

		// TODO: validate that userMigrationSystemId is set
		const filteredFetchedData: SanisResponse[] = this.schulconnexFetchImportUsersService.filterAlreadyFetchedData(
			fetchedData,
			this.userImportFeatures.userMigrationSystemId
		);

		const system = await this.userImportService.getMigrationSystem();
		const mappedImportUsers: ImportUser[] = this.schulconnexFetchImportUsersService.mapDataToUserImportEntities(
			filteredFetchedData,
			system,
			currentUser.school
		);

		// TODO: do matching

		await this.userImportService.saveImportUsers(mappedImportUsers);
	}
}
