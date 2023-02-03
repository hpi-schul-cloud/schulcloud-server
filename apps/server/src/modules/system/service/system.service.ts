import { Injectable } from '@nestjs/common';
import { EntityId, System, SystemType, SystemTypeEnum } from '@shared/domain';
import { SystemRepo } from '@shared/repo';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class SystemService {
	constructor(private readonly systemRepo: SystemRepo) {}

	async find(type: SystemType | undefined): Promise<SystemDto[]> {
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

	/*
	This returns systems that provide authentication via OAuth
	It merges systems that dBildungscloud communicates with directly
	and systems that are queried via keycloak brokering.
	*/
	async findOAuth(): Promise<SystemDto[]> {
		const systemEntities = await this.findDirectOauthSystems();
		const generatedOAuthsystems = await this.findOauthViaKeycloakSystems();

		return [...systemEntities, ...generatedOAuthsystems];
	}

	async findOidc(): Promise<SystemDto[]> {
		const systemEntities = await this.systemRepo.findByFilter(SystemTypeEnum.OIDC);
		return SystemMapper.mapFromEntitiesToDtos(systemEntities);
	}

	async findOAuthById(id: EntityId): Promise<SystemDto> {
		let systemEntity = await this.systemRepo.findById(id);
		if (systemEntity.type === SystemTypeEnum.OIDC) {
			const keycloakSystem = await this.lookupIdentityManagement();
			if (keycloakSystem) {
				systemEntity = this.generateBrokerSystem(systemEntity, keycloakSystem);
				systemEntity.id = id;
			}
		}
		return SystemMapper.mapFromEntityToDto(systemEntity);
	}

	async save(systemDto: SystemDto): Promise<SystemDto> {
		let system: System;
		if (systemDto.id) {
			system = await this.systemRepo.findById(systemDto.id);
			system.type = systemDto.type;
			system.alias = systemDto.alias;
			system.displayName = systemDto.displayName;
			system.oauthConfig = systemDto.oauthConfig;
			system.config = { ...systemDto.oidcConfig };
			system.provisioningStrategy = systemDto.provisioningStrategy;
			system.url = systemDto.url;
		} else {
			system = new System({
				type: systemDto.type,
				alias: systemDto.alias,
				displayName: systemDto.displayName,
				oauthConfig: systemDto.oauthConfig,
				provisioningStrategy: systemDto.provisioningStrategy,
				url: systemDto.url,
			});
			system.config = { ...systemDto.oauthConfig };
		}
		await this.systemRepo.save(system);
		return SystemMapper.mapFromEntityToDto(system);
	}

	private async findDirectOauthSystems(): Promise<SystemDto[]> {
		const ldapSystemEntities = await this.systemRepo.findByFilter(SystemTypeEnum.LDAP, true);
		const oauthSystemEntities = await this.systemRepo.findByFilter(SystemTypeEnum.OAUTH, true);
		return SystemMapper.mapFromEntitiesToDtos([...ldapSystemEntities, ...oauthSystemEntities]);
	}

	private async findOauthViaKeycloakSystems(): Promise<SystemDto[]> {
		const keycloakSystem = await this.lookupIdentityManagement();
		if (!keycloakSystem) {
			return [];
		}
		const oidcSystems = await this.systemRepo.findByFilter(SystemTypeEnum.OIDC);

		const generatedOAuthsystems: System[] = [];
		oidcSystems.forEach((systemEntity) => {
			const generatedSystem: System = this.generateBrokerSystem(systemEntity, keycloakSystem);
			generatedOAuthsystems.push(generatedSystem);
		});
		return generatedOAuthsystems;
	}

	private async lookupIdentityManagement() {
		const keycloakConfig = await this.systemRepo.findByFilter(SystemTypeEnum.KEYCLOAK, true);
		if (keycloakConfig.length === 1) {
			return keycloakConfig[0];
		}
		return null;
	}

	private generateBrokerSystem(systemEntity: System, identityManagement: System) {
		const generatedSystem: System = new System({
			type: SystemTypeEnum.OAUTH,
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
