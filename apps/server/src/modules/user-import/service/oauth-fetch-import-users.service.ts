import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { SanisResponse } from '@modules/provisioning';
import { UserService } from '@modules/user';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { ImportUser, SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { OAuthGrantType } from '../../oauth/interface/oauth-grant-type.enum';
import { TokenRequestMapper } from '../../oauth/mapper/token-request.mapper';
import { OauthTokenResponse } from '../../oauth/service/dto';
import { AccessTokenRequest } from '../../oauth/service/dto/access-token-request';
import { UserImportFetchingFailureLoggableException } from '../loggable';

@Injectable()
export class OauthFetchImportUsersService {
	constructor(
		private readonly httpService: HttpService,
		private readonly userService: UserService,
		private readonly oauthAdapterService: OauthAdapterService
	) {}

	public async getData(
		tokenEndpoint: string,
		fetchEndpoint: string,
		officialSchoolNumber: string,
		clientId: string,
		clientSecret: string
	): Promise<AxiosResponse<SanisResponse[]>> {
		try {
			const token: OAuthTokenDto = await this.requestToken(tokenEndpoint, clientId, clientSecret);

			const response: AxiosResponse<SanisResponse[]> = await lastValueFrom(
				// TODO: add official school number to fetchEndpoint
				this.httpService.get(fetchEndpoint, { headers: { Authorization: `Bearer ${token.accessToken}` } })
			);

			if (response.status !== HttpStatus.OK) {
				throw new Error(`HTTP request failed with status ${response.status}`);
			}

			return response;
		} catch (e: unknown) {
			throw new UserImportFetchingFailureLoggableException(fetchEndpoint);
		}
	}

	private async requestToken(tokenEndpoint: string, clientId: string, clientSecret: string): Promise<OAuthTokenDto> {
		const payload: AccessTokenRequest = new AccessTokenRequest({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const responseToken: OauthTokenResponse = await this.oauthAdapterService.sendAuthenticationCodeTokenRequest(
			tokenEndpoint,
			payload
		);

		const tokenDto: OAuthTokenDto = TokenRequestMapper.mapTokenResponseToDto(responseToken);
		return tokenDto;
	}

	public filterAlreadyFetchedData(data: SanisResponse[], systemId: EntityId): SanisResponse[] {
		const filteredData: SanisResponse[] = data.filter(async (user: SanisResponse): Promise<boolean> => {
			const foundUser: UserDO | null = await this.userService.findByExternalId(user.pid, systemId);

			return !foundUser;
		});

		return filteredData;
	}

	public mapToImportUser(data: SanisResponse[], school: SchoolEntity, system: SystemEntity): ImportUser[] {
		const importUsers: ImportUser[] = data.map((sanisUser: SanisResponse): ImportUser => {
			const importUser = new ImportUser({
				school,
				system,
				ldapDn: 'asds',
				externalId: sanisUser.pid,
				firstName: sanisUser.person.name.vorname,
				lastName: sanisUser.person.name.familienname,
				email: 'asdasd',
			});

			return importUser;
		});

		return importUsers;
	}
}
