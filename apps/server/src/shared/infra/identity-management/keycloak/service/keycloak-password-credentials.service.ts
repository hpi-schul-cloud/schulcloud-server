import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemTypeEnum } from '@shared/domain';
import { GuardAgainst } from '@shared/common';

@Injectable()
export class KeycloakPasswordCredentialsService {
	constructor(private readonly httpService: HttpService, private readonly systemService: SystemService) {}

	async checkCredentials(username: string, password: string): Promise<string | undefined> {
		const systems = await this.systemService.find(SystemTypeEnum.KEYCLOAK);
		const keycloakSystem = GuardAgainst.nullOrUndefined(systems.at(0), new Error('No Keycloak system found'));
		const url = GuardAgainst.nullOrUndefined(keycloakSystem.oidcConfig?.tokenUrl, new Error('No token endpoint'));
		const data = {
			username,
			password,
			grant_type: 'password',
			client_id: keycloakSystem.oidcConfig?.clientId,
			client_secret: keycloakSystem.oidcConfig?.clientSecret,
		};

		return 'jwt';
		/*
        try {
            const response = await firstValueFrom(this.httpService.post(url, data));
        } catch (err) {}
*/
	}
}
