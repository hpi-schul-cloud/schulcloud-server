import { Inject, Injectable } from '@nestjs/common';
import { SystemService } from '@src/modules/system/service/system.service';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { SystemTypeEnum } from '@shared/domain';
import { GuardAgainst } from '@shared/common';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class KeycloakSystemService {
	private _keycloak: SystemDto | undefined;

	constructor(
		private readonly systemService: SystemService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: IEncryptionService
	) {}

	resetCache(): void {
		this._keycloak = undefined;
	}

	async getClientId(): Promise<string | never> {
		const kc = await this.getKeycloak();
		const clientId = GuardAgainst.nullOrUndefined(kc.oauthConfig?.clientId, new Error('No client id set'));
		return clientId;
	}

	async getClientSecret(): Promise<string | never> {
		const kc = await this.getKeycloak();
		const clientSecret = GuardAgainst.nullOrUndefined(kc.oauthConfig?.clientSecret, new Error('No client secret set'));
		return this.encryptionService.decrypt(clientSecret);
	}

	async getTokenEndpoint(): Promise<string | never> {
		const kc = await this.getKeycloak();
		const tokenEndpoint = GuardAgainst.nullOrUndefined(
			kc.oauthConfig?.tokenEndpoint,
			new Error('No token endpoint set')
		);
		return tokenEndpoint;
	}

	private async getKeycloak(): Promise<SystemDto> {
		if (!this._keycloak) {
			const systems = await this.systemService.find(SystemTypeEnum.KEYCLOAK);
			this._keycloak = GuardAgainst.nullOrUndefined(systems.at(0), new Error('No Keycloak system found'));
		}
		return this._keycloak;
	}
}
