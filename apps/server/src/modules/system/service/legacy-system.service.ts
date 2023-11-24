import { IdentityManagementOauthService } from '@infra/identity-management';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { EntityId, SystemEntity, SystemTypeEnum } from '@shared/domain';
import { LegacySystemRepo } from '@shared/repo';
import { SystemMapper } from '../mapper';
import { SystemDto } from './dto';

// TODO N21-1547: Fully replace this service with SystemService
/**
 * @deprecated use {@link SystemService}
 */
@Injectable()
export class LegacySystemService {
	constructor(
		private readonly systemRepo: LegacySystemRepo,
		private readonly idmOauthService: IdentityManagementOauthService
	) {}

	async findById(id: EntityId): Promise<SystemDto> {
		let system = await this.systemRepo.findById(id);
		[system] = await this.generateBrokerSystems([system]);
		if (!system) {
			throw new EntityNotFoundError(SystemEntity.name, { id });
		}
		return SystemMapper.mapFromEntityToDto(system);
	}

	async findByType(type?: SystemTypeEnum): Promise<SystemDto[]> {
		let systems: SystemEntity[];
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
		let system: SystemEntity;
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
			system = new SystemEntity({
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

	private async generateBrokerSystems(systems: SystemEntity[]): Promise<[] | SystemEntity[]> {
		if (!(await this.idmOauthService.isOauthConfigAvailable())) {
			return systems.filter((system) => !(system.oidcConfig && !system.oauthConfig));
		}
		const brokerConfig = await this.idmOauthService.getOauthConfig();
		let generatedSystem: SystemEntity;
		return systems.map((system) => {
			if (system.oidcConfig && !system.oauthConfig) {
				generatedSystem = new SystemEntity({
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
