import { Injectable } from '@nestjs/common';
import { KeycloakAdministrationService } from './keycloak-administration.service';

@Injectable()
export class PasswordLoginService {
	constructor(private readonly kcAdminService: KeycloakAdministrationService) {}

	async checkCredentials(username: string, password: string): Promise<boolean> {
		const kc = await this.kcAdminService.callKcAdminClient();
		throw new Error('Method not implemented');
	}
}
