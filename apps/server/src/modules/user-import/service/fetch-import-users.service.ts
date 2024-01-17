import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { ImportUser } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { SanisResponse } from '@modules/provisioning';
import { UserService } from '@modules/user';
import { UserImportFetchingFailureLoggableException } from '../loggable';

@Injectable()
export class FetchImportUsersService {
	constructor(private readonly httpService: HttpService, private readonly userService: UserService) {}

	public async getData(
		url: string,
		officialSchoolNumber: string,
		clientId?: string,
		clientSecret?: string
	): Promise<AxiosResponse<SanisResponse[]>> {
		try {
			const response: AxiosResponse<SanisResponse[]> = await lastValueFrom(
				this.httpService.get(url, this.createRequestConfig(clientId, clientSecret))
			);

			if (response.status !== HttpStatus.OK) {
				throw new Error(`HTTP request failed with status ${response.status}`);
			}

			return response;
		} catch (e: unknown) {
			throw new UserImportFetchingFailureLoggableException(url);
		}
	}

	private createRequestConfig(clientId?: string, clientSecret?: string): AxiosRequestConfig {
		const config: AxiosRequestConfig = {
			data: {
				grant_type: 'client_credentials',
				client_id: clientId,
				client_secret: clientSecret,
			},
		};

		return config;
	}

	public filterAlreadyFetchedData(data: SanisResponse[], systemId: EntityId): SanisResponse[] {
		const filteredData: SanisResponse[] = data.filter(async (user: SanisResponse): Promise<boolean> => {
			const foundUser: UserDO | null = await this.userService.findByExternalId(user.pid, systemId);

			return !foundUser;
		});

		return filteredData;
	}

	public mapToImportUser(data: SanisResponse[], school: EntityId, systemId: EntityId): ImportUser[] {
		// const schoolEntity: SchoolEntity =

		const importUsers: ImportUser[] = data.map((sanisUser: SanisResponse): ImportUser => {
			const importUser = new ImportUser({
				school,
				system: systemId,
				ldapDn: 'asds',
				externalId: sanisUser.pid,
				firstName: sanisUser.person.name.vorname,
				lastName: sanisUser.person.name.familienname,
				email: 'asdasd',
			});
		});
	}
}
