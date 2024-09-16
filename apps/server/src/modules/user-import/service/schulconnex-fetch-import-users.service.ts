import { SchulconnexResponse, SchulconnexRestClient } from '@infra/schulconnex-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { System } from '@modules/system';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { SchoolEntity } from '@shared/domain/entity';
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

		const response: SchulconnexResponse[] = await this.schulconnexRestClient.getPersonenInfo({
			vollstaendig: ['personen', 'personenkontexte', 'organisationen', 'gruppen'],
			'organisation.id': externalSchoolId,
		});

		const mappedImportUsers: ImportUser[] = SchulconnexImportUserMapper.mapDataToUserImportEntities(
			response,
			system,
			school,
			this.em
		);

		return mappedImportUsers;
	}

	public async filterAlreadyMigratedUser(importUsers: ImportUser[], system: System): Promise<ImportUser[]> {
		const filteredUsers: ImportUser[] = (
			await Promise.all(
				importUsers.map(async (importUser: ImportUser): Promise<ImportUser | null> => {
					const foundUser: UserDO | null = await this.userService.findByExternalId(importUser.externalId, system.id);
					return foundUser ? null : importUser;
				})
			)
		).filter((user: ImportUser | null): user is ImportUser => user !== null);

		return filteredUsers;
	}
}
