import { Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { KeycloakConfigurationUc } from '../uc/keycloak-configuration.uc';

@Controller('management/idm')
export class KeycloakManagementController {
	constructor(private readonly keycloakManagementUc: KeycloakConfigurationUc, private readonly logger: LegacyLogger) {
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
		// do not use this.keycloakManagementUc.check(), the logic should be rewrite to get valid http handling and responses
		if (await this.keycloakManagementUc.check()) {
			try {
				await this.keycloakManagementUc.configure();
				// do not return dirctly write it to a const before and think about the naming :D
				return await this.keycloakManagementUc.seed();
			} catch (err) {
				this.logger.error(err);
				return -1;
			}
		}
		throw new ServiceUnavailableException();
	}
}
