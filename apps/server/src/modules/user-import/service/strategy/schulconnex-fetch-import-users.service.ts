import { SanisResponse, SchulconnexRestClient } from '@infra/schulconnex-client';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { ImportUser } from '@shared/domain/entity';
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

	// TODO: implement mapping
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public mapDataToUserImportEntity(response: SanisResponse[]): Promise<ImportUser> {
		throw new Error('Method not implemented.');
	}

	public filterAlreadyFetchedData(data: SanisResponse[], systemId: EntityId): SanisResponse[] {
		const filteredData: SanisResponse[] = data.filter(async (user: SanisResponse): Promise<boolean> => {
			const foundUser: UserDO | null = await this.userService.findByExternalId(user.pid, systemId);

			return !foundUser;
		});

		return filteredData;
	}
}
