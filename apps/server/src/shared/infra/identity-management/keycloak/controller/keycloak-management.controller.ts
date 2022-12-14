import { Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

@Controller('management/idm')
export class KeycloakManagementController {
	constructor(private readonly keycloakManagementUc: KeycloakManagementUc, private readonly logger: Logger) {
		this.logger.setContext(KeycloakManagementController.name);
	}

	/**
	 * This connects to IDM, seeds the test users and seeds the identity providers.
	 * Used by auto-deployment for develop environment (job_init_idm.yml.j2) via cURL
	 *
	 * @returns The number of seeded users
	 * @throws ServiceUnavailableException if IDM is not ready.
	 */
	@Post('seed')
	async importSeedData(): Promise<number> {
		if (await this.keycloakManagementUc.check()) {
			try {
				await this.keycloakManagementUc.configure();
				return await this.keycloakManagementUc.seed();
			} catch (err) {
				// this.logger.error(err);
				return -1;
			}
		}
		throw new ServiceUnavailableException();
	}
}
