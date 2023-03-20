import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { EntityId, System, SystemTypeEnum } from '@shared/domain';
import { IdentityManagementOauthService } from '@shared/infra/identity-management/identity-management-oauth.service';
import { SystemRepo } from '@shared/repo';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class SystemService {
	constructor(
		private readonly systemRepo: SystemRepo,
		private readonly idmOauthService: IdentityManagementOauthService
	) {}

	async findById(id: EntityId): Promise<SystemDto> {
		let system = await this.systemRepo.findById(id);
		[system] = await this.generateBrokerSystems([system]);
		if (!system) {
			throw new EntityNotFoundError(System.name, { id });
		}
		return SystemMapper.mapFromEntityToDto(system);
	}

	async findByType(type?: SystemTypeEnum): Promise<SystemDto[]> {
		let systems: System[];
		if (type && type === SystemTypeEnum.OAUTH) {
			const oauthSystems = await this.systemRepo.findByFilter(SystemTypeEnum.OAUTH);
			const oidcSystems = await this.systemRepo.findByFilter(SystemTypeEnum.OIDC);
			systems = [...oauthSystems, ...oidcSystems];
		} else if (type) {
			systems = await this.systemRepo.findByFilter(type);
		} else {
			systems = await this.systemRepo.findAll();
		}
		systems = await this.generateBrokerSystems(systems);
		return SystemMapper.mapFromEntitiesToDtos(systems);
	}

	async save(systemDto: SystemDto): Promise<SystemDto> {
		let system: System;
		if (systemDto.id) {
			system = await this.systemRepo.findById(systemDto.id);
			system.type = systemDto.type;
			system.alias = systemDto.alias;
			system.displayName = systemDto.displayName;
			system.oauthConfig = systemDto.oauthConfig;
			system.provisioningStrategy = systemDto.provisioningStrategy;
			system.provisioningUrl = systemDto.provisioningUrl;
			system.url = systemDto.url;
		} else {
			system = new System({
				type: systemDto.type,
				alias: systemDto.alias,
				displayName: systemDto.displayName,
				oauthConfig: systemDto.oauthConfig,
				provisioningStrategy: systemDto.provisioningStrategy,
				provisioningUrl: systemDto.provisioningUrl,
				url: systemDto.url,
			});
		}
		await this.systemRepo.save(system);
		return SystemMapper.mapFromEntityToDto(system);
	}

	private async generateBrokerSystems(systems: System[]): Promise<[] | System[]> {
		if (!(await this.idmOauthService.isOauthConfigAvailable())) {
			return systems.filter((system) => !(system.oidcConfig && !system.oauthConfig));
		}
		const brokerConfig = await this.idmOauthService.getOauthConfig();
		let generatedSystem: System;
		return systems.map((system) => {
			if (system.oidcConfig && !system.oauthConfig) {
				generatedSystem = new System({
					type: SystemTypeEnum.OAUTH,
					alias: system.alias,
					displayName: system.displayName ? system.displayName : system.alias,
					provisioningStrategy: system.provisioningStrategy,
					provisioningUrl: system.provisioningUrl,
					url: system.url,
				});
				generatedSystem.id = system.id;
				generatedSystem.oauthConfig = { ...brokerConfig };
				generatedSystem.oauthConfig.idpHint = system.oidcConfig.idpHint;
				generatedSystem.oauthConfig.redirectUri += system.id;
				return generatedSystem;
			}
			return system;
		});
	}
}
