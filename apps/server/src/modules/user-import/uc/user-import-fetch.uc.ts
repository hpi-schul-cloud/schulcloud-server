import { SanisResponse } from '@infra/schulconnex-client';
import { AuthorizationService } from '@modules/authorization';
import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import { SchulconnexFetchImportUsersService } from '../service';

@Injectable()
export class UserImportFetchUc {
	constructor(
		@Inject(UserImportFeatures) private readonly userImportFeatures: IUserImportFeatures,
		private readonly schulconnexFetchImportUsersService: SchulconnexFetchImportUsersService,
		private readonly authorizationService: AuthorizationService
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

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const filteredFetchedData: SanisResponse[] = this.schulconnexFetchImportUsersService.filterAlreadyFetchedData(
			fetchedData,
			this.userImportFeatures.userMigrationSystemId
		);

		// TODO: map to import user
		// const mappedImportUsers: ImportUser[] = this.schulconnexFetchImportUsersService.mapDataToUserImportEntity();

		// TODO: do matching

		// TODO: save
		// await this.userImportService.saveImportUsers(mappedImportUsers);
	}
}
