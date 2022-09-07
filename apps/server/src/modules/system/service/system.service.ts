import { Injectable } from '@nestjs/common';
import { EntityId, System } from '@shared/domain';
import { SysType } from '@shared/infra/identity-management';
import { SystemRepo } from '@shared/repo';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class SystemService {
	constructor(private readonly systemRepo: SystemRepo) {}

	async find(type: string | undefined): Promise<SystemDto[]> {
		let systemEntities: System[];
		if (!type) {
			systemEntities = await this.systemRepo.findAll();
		} else {
			systemEntities = await this.systemRepo.findByFilter(type, false);
		}
		return SystemMapper.mapFromEntitiesToDtos(systemEntities);
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const entity = await this.systemRepo.findById(id);
		return SystemMapper.mapFromEntityToDto(entity);
	}

	async findOAuth(): Promise<SystemDto[]> {
		const systemEntities = await this.systemRepo.findByFilter(SysType.OAUTH, true);
		const oidcSystems = await this.systemRepo.findByFilter(SysType.OIDC);

		const keycloakSystem = await this.lookupIdentityManagement();
		const generatedOAuthsystems: System[] = [];
		if (keycloakSystem) {
			oidcSystems.forEach((systemEntity) => {
				const generatedSystem: System = this.generateBrokerSystem(systemEntity, keycloakSystem);
				generatedOAuthsystems.push(generatedSystem);
			});
		}

		return SystemMapper.mapFromEntitiesToDtos([...systemEntities, ...generatedOAuthsystems]);
	}

	async findOAuthById(id: EntityId): Promise<SystemDto> {
		let systemEntity = await this.systemRepo.findById(id);
		if (systemEntity.type === SysType.OIDC) {
			const keycloakSystem = await this.lookupIdentityManagement();
			if (keycloakSystem) {
				systemEntity = this.generateBrokerSystem(systemEntity, keycloakSystem);
				systemEntity.id = id;
			}
		}
		return SystemMapper.mapFromEntityToDto(systemEntity);
	}

	private async lookupIdentityManagement() {
		const keycloakConfig = await this.systemRepo.findByFilter(SysType.KEYCLOAK, true);
		if (keycloakConfig.length === 1) {
			return keycloakConfig[0];
		}
		return null;
	}

	private generateBrokerSystem(systemEntity: System, identityManagement: System) {
		const generatedSystem: System = new System({
			type: SysType.OAUTH,
			alias: systemEntity.alias,
			displayName: systemEntity.displayName ? systemEntity.displayName : systemEntity.alias,
			oauthConfig: identityManagement.oauthConfig,
		});
		if (generatedSystem.oauthConfig) {
			generatedSystem.oauthConfig.redirectUri += systemEntity.id;
		}
		return generatedSystem;
	}
}
