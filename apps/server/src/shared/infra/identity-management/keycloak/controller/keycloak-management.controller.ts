import {Controller, Param, Post, ServiceUnavailableException} from '@nestjs/common';
import {Logger} from '@src/core/logger';
import {EnvType} from '../../env.type';
import {KeycloakManagementUc} from '../uc/Keycloak-management.uc';

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

	/**
	 * Configures the IDM with systems from the database.
	 *
	 * @param envType The environment type, can be 'dev' or 'prod'. Default 'prod'.
	 * @param sysType The system type to configure.
	 */
	// @Post('configure')
	// async applyConfiguration(@Param() envType?: EnvType, @Param() sysType?: SysType): Promise<number> {
	// 	envType ??= EnvType.PROD;
	// 	sysType ??= SysType.OIDC;
	// 	if (await this.keycloakManagementUc.check()) {
	// 		try {
	// 			return await this.keycloakManagementUc.configureIdentityProviders({ envType });
	// 		} catch (err) {
	// 			this.logger.error(err);
	// 			return -1;
	// 		}
	// 	}
	// 	throw new ServiceUnavailableException();
	// }

	@Post('configure')
	async configure(@Param() envType?: EnvType): Promise<number> {
		envType ??= EnvType.PROD;
		if (await this.keycloakManagementUc.check()) {
			try {
				let count = 0;
				if (envType === EnvType.DEV) {
					count += await this.keycloakManagementUc.seed();
				}
				count += await this.keycloakManagementUc.configureIdentityProviders({ envType });
				count += await this.keycloakManagementUc.configureAuthenticationFlows();
				return count;
			} catch (err) {
				this.logger.error(err);
				return -1;
			}
		}
		throw new ServiceUnavailableException();
	}
}
