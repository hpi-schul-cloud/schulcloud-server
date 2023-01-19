import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
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

	getClientId(): Promise<string> {
		throw new NotImplementedException();
	}

	getClientSecret(): Promise<string> {
		// TODO: the client secret is encrypted in the db
		throw new NotImplementedException();
	}

	getTokenEndpoint(): Promise<string> {
		throw new NotImplementedException();
	}

	private async getKeycloak(): Promise<SystemDto> {
		if (!this._keycloak) {
			const systems = await this.systemService.find(SystemTypeEnum.KEYCLOAK);
			this._keycloak = GuardAgainst.nullOrUndefined(systems.at(0), new Error('No Keycloak system found'));
		}
		return this._keycloak;
	}
}
