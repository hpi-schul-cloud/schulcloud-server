import { Controller, All } from '@nestjs/common';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

@Controller('management/idm')
export class KeycloakManagementController {
	constructor(private keycloakManagementUc: KeycloakManagementUc) {}

	@All('seed')
	async importSeedData(): Promise<number> {
		return this.keycloakManagementUc.seed();
	}
}
