import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { OauthConfig, System, SystemService } from '@modules/system';
import { Inject, Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchulcloudTheme } from '@shared/domain/types';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';

@Injectable()
export class SystemsSeedDataService {
	constructor(
		@Inject(MANAGEMENT_SEED_DATA_CONFIG_TOKEN) private readonly config: ManagementSeedDataConfig,
		private readonly systemService: SystemService,
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: EncryptionService
	) {}

	public async import(): Promise<number> {
		const {
			scTheme,
			schulconnexClientId: moinSchuleClientId,
			schulconnexClientSecret: moinSchuleClientSecret,
			brandenburgClientId,
			brandenburgClientSecret,
			brandenburgAuthEndpoint,
			brandenburgTokenEndpoint,
			brandenburgJwksEndpoint,
			brandenburgIssuer,
			brandenburgEndSessionEndpoint,
			brandenburgProvisioningUrl,
		} = this.config;

		let importedCount = 0;

		if (scTheme === SchulcloudTheme.NIEDERSACHSEN && moinSchuleClientId && moinSchuleClientSecret) {
			const encryptedMoinSchuleSecret: string = this.defaultEncryptionService.encrypt(moinSchuleClientSecret);

			await this.systemService.save(
				new System({
					id: '0000d186816abba584714c93',
					alias: 'moin.schule',
					displayName: 'moin.schule',
					type: 'oauth',
					provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					provisioningUrl: 'https://api-dienste.stage.niedersachsen-login.schule/v1/person-info',
					oauthConfig: new OauthConfig({
						clientId: moinSchuleClientId,
						clientSecret: encryptedMoinSchuleSecret,
						tokenEndpoint: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/token',
						grantType: 'authorization_code',
						scope: 'openid',
						responseType: 'code',
						redirectUri: '',
						authEndpoint: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/auth',
						provider: 'moin.schule',
						jwksEndpoint: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/certs',
						issuer: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS',
						endSessionEndpoint:
							'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/logout',
					}),
				})
			);

			importedCount += 1;
		}

		if (
			scTheme === SchulcloudTheme.BRANDENBURG &&
			brandenburgClientId &&
			brandenburgClientSecret &&
			brandenburgAuthEndpoint &&
			brandenburgTokenEndpoint &&
			brandenburgJwksEndpoint &&
			brandenburgIssuer &&
			brandenburgEndSessionEndpoint &&
			brandenburgProvisioningUrl
		) {
			const encryptedBrandenburgSecret: string = this.defaultEncryptionService.encrypt(brandenburgClientSecret);

			await this.systemService.save(
				new System({
					id: '5cf5a54f067252f954f47bba',
					alias: 'Brandenburg',
					displayName: 'Brandenburg',
					type: 'oauth',
					provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
					provisioningUrl: brandenburgProvisioningUrl,
					oauthConfig: new OauthConfig({
						clientId: brandenburgClientId,
						clientSecret: encryptedBrandenburgSecret,
						tokenEndpoint: brandenburgTokenEndpoint,
						grantType: 'authorization_code',
						scope: 'openid',
						responseType: 'code',
						redirectUri: '',
						authEndpoint: brandenburgAuthEndpoint,
						provider: 'Brandenburg',
						jwksEndpoint: brandenburgJwksEndpoint,
						issuer: brandenburgIssuer,
						endSessionEndpoint: brandenburgEndSessionEndpoint,
					}),
				})
			);

			importedCount += 1;
		}

		return importedCount;
	}
}
