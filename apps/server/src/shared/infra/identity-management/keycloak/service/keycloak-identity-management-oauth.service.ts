import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemTypeEnum } from '@shared/domain';
import { GuardAgainst } from '@shared/common';
import { firstValueFrom } from 'rxjs';
import qs from 'qs';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { Logger } from '@src/core/logger';
import { AxiosError } from 'axios';
import { IdentityManagementOathService } from '../../identity-management-oath.service';

@Injectable()
export class KeycloakIdentityManagementOauthService extends IdentityManagementOathService {
	constructor(
		private readonly httpService: HttpService,
		private readonly systemService: SystemService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: IEncryptionService,
		private readonly logger: Logger
	) {
		super();
	}

	async resourceOwnerPasswordGrant(username: string, password: string): Promise<string | undefined> {
		const systems = await this.systemService.find(SystemTypeEnum.KEYCLOAK);
		const { oauthConfig } = GuardAgainst.nullOrUndefined(systems.at(0), new Error('No Keycloak system found'));
		const url = GuardAgainst.nullOrUndefined(oauthConfig?.tokenEndpoint, new Error('No token endpoint'));
		const clientId = GuardAgainst.nullOrUndefined(oauthConfig?.clientId, new Error('No client id'));
		const clientSecret = GuardAgainst.nullOrUndefined(oauthConfig?.clientSecret, new Error('No client secret'));
		const data = {
			username,
			password,
			grant_type: 'password',
			client_id: clientId,
			client_secret: this.encryptionService.decrypt(clientSecret),
		};
		try {
			const response = await firstValueFrom(
				this.httpService.request<{ access_token: string }>({
					method: 'post',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					url,
					data: qs.stringify(data),
				})
			);
			return response.data.access_token;
		} catch (err) {
			if (err instanceof AxiosError && err.response?.status === 400) {
				this.logger.log(err);
			} else {
				this.logger.error(err);
			}
			return undefined;
		}
	}
}
