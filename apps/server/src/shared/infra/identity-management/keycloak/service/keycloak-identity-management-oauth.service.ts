import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import qs from 'qs';
import { IdentityManagementOathService } from '../../identity-management-oath.service';
import { KeycloakSystemService } from './keycloak-system.service';

@Injectable()
export class KeycloakIdentityManagementOauthService extends IdentityManagementOathService {
	constructor(private readonly kcSystemService: KeycloakSystemService, private readonly httpService: HttpService) {
		super();
	}

	async resourceOwnerPasswordGrant(username: string, password: string): Promise<string | undefined> {
		const url = await this.kcSystemService.getTokenEndpoint();
		const clientId = await this.kcSystemService.getClientId();
		const clientSecret = await this.kcSystemService.getClientSecret();
		const data = {
			username,
			password,
			grant_type: 'password',
			client_id: clientId,
			client_secret: clientSecret,
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
			return undefined;
		}
	}
}
