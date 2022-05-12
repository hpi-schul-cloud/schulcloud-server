import { Controller, All, ServiceUnavailableException } from '@nestjs/common';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

@Controller('management/idm')
export class KeycloakManagementController {
	constructor(private keycloakManagementUc: KeycloakManagementUc) {}

	/**
	 * This connects to IDM and seeds the test users.
	 *
	 * @returns The number of seeded users
	 * @throws ServiceUnavailableException if IDM is not ready.
	 */
	@All('seed')
	async importSeedData(): Promise<number> {
		if (await this.keycloakManagementUc.check()) {
			try {
				return await this.keycloakManagementUc.seed();
			} catch (err) {
				return -1;
			}
		}
		throw new ServiceUnavailableException();
	}
}
