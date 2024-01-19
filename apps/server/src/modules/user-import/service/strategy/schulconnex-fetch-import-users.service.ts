import { SanisResponse, SchulconnexRestClient } from '@infra/schulconnex-client';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { ImportUser, SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { AbstractOauthFetchImportUserStrategy } from './abstract-oauth-fetch-import-user.strategy';
import { SanisOauthFetchParams } from './sanis-oauth-fetch-params';

@Injectable()
export class SchulconnexFetchImportUsersService extends AbstractOauthFetchImportUserStrategy<
	SanisResponse[],
	SanisOauthFetchParams
> {
	constructor(
		private readonly schulconnexRestClient: SchulconnexRestClient,
		private readonly userService: UserService
	) {
		super();
	}

	public async getData(params: SanisOauthFetchParams): Promise<SanisResponse[]> {
		const response: SanisResponse[] = await this.schulconnexRestClient.getPersonenInfo({
			vollstaendig: 'personen,personenkontexte,organisationen',
			'organisation.id': params.externalSchoolId,
		});

		return response;
	}

	public mapDataToUserImportEntities(
		response: SanisResponse[],
		system: SystemEntity,
		school: SchoolEntity
	): ImportUser[] {
		const importUsers: ImportUser[] = response.map(
			(sanisUser: SanisResponse): ImportUser =>
				new ImportUser({
					system,
					school,
					ldapDn: `uid=${sanisUser.person.name.vorname}.${sanisUser.person.name.familienname},`,
					externalId: sanisUser.pid,
					firstName: sanisUser.person.name.vorname,
					lastName: sanisUser.person.name.familienname,
					email: '',
				})
		);

		return importUsers;
	}

	public filterAlreadyMigratedUser(data: SanisResponse[], systemId: EntityId): SanisResponse[] {
		const filteredData: SanisResponse[] = data.filter(async (user: SanisResponse): Promise<boolean> => {
			const foundUser: UserDO | null = await this.userService.findByExternalId(user.pid, systemId);

			return !foundUser;
		});

		return filteredData;
	}
}
