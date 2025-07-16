import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { OauthConfig, System, SystemService } from '@modules/system';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ManagementSeedDataConfig } from '../config';

@Injectable()
export class SystemsSeedDataService {
	constructor(
		private readonly configService: ConfigService<ManagementSeedDataConfig, true>,
		private readonly systemService: SystemService,
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: EncryptionService
	) {}

	public async import(): Promise<number> {
		const scTheme: string | undefined = this.configService.get<string>('SC_THEME');
		const moinSchuleClientId: string | undefined = this.configService.get<string>('SCHULCONNEX_CLIENT_ID');
		const moinSchuleClientSecret: string | undefined = this.configService.get<string>('SCHULCONNEX_CLIENT_SECRET');

		if (scTheme === 'n21' && moinSchuleClientId && moinSchuleClientSecret) {
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

			return 1;
		}

		return 0;
	}
}
