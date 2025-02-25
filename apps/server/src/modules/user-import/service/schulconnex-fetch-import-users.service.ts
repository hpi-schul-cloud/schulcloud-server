import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { System } from '@modules/system';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ImportUser } from '../entity';
import { UserImportSchoolExternalIdMissingLoggableException } from '../loggable';
import { SchulconnexImportUserMapper } from '../mapper';

@Injectable()
export class SchulconnexFetchImportUsersService {
	constructor(
		private readonly schulconnexRestClient: SchulconnexRestClient,
		private readonly userService: UserService,
		private readonly em: EntityManager
	) {}

	public async getData(school: SchoolEntity, system: System): Promise<ImportUser[]> {
		const externalSchoolId: string | undefined = school.externalId;
		if (!externalSchoolId) {
			throw new UserImportSchoolExternalIdMissingLoggableException(school.id);
		}

		const response = await this.schulconnexRestClient.getPersonenInfo({
			vollstaendig: ['personen', 'personenkontexte', 'organisationen', 'gruppen'],
			'organisation.id': externalSchoolId,
		});

		const mappedImportUsers = SchulconnexImportUserMapper.mapDataToUserImportEntities(
			response,
			system,
			school,
			this.em
		);

		return mappedImportUsers;
	}

	public async filterAlreadyMigratedUser(importUsers: ImportUser[], system: System): Promise<ImportUser[]> {
		const filteredUsers = (
			await Promise.all(
				importUsers.map(async (importUser: ImportUser): Promise<ImportUser | null> => {
					const foundUser = await this.userService.findByExternalId(importUser.externalId, system.id);
					return foundUser ? null : importUser;
				})
			)
		).filter((user: ImportUser | null): user is ImportUser => user !== null);

		return filteredUsers;
	}
}
