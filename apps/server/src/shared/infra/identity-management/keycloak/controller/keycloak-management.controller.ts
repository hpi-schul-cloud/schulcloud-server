import { Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

@Controller('management/idm')
export class KeycloakManagementController {
	constructor(private keycloakManagementUc: KeycloakManagementUc, private logger: Logger) {
		this.logger.setContext(KeycloakManagementController.name);
	}

	/**
	 * This connects to IDM and seeds the test users.
	 *
	 * @returns The number of seeded users
	 * @throws ServiceUnavailableException if IDM is not ready.
	 */
	@Post('seed')
	async importSeedData(): Promise<number> {
		if (await this.keycloakManagementUc.check()) {
			try {
				return await this.keycloakManagementUc.seed();
			} catch (err) {
				this.logger.error(err);
				return -1;
			}
		}
		throw new ServiceUnavailableException();
	}

	@Post('configure')
	async configure(): Promise<number> {
		if (await this.keycloakManagementUc.check()) {
			try {
				let count = 0;
				if (false) {
					count += await this.keycloakManagementUc.seed();
				}
				count += await this.keycloakManagementUc.configureIdentityProviders();
				return count;
			} catch (err) {
				this.logger.error(err);
				return -1;
			}
		}
		throw new ServiceUnavailableException();
	}
}
