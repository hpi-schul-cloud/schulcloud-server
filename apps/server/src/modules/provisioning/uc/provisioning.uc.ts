import { Injectable } from '@nestjs/common';
import { UserUc } from '@src/modules/user/uc';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';
import { Logger } from '@src/core/logger';
import { ProvisioningException } from '@src/modules/provisioning/exception/provisioning.exception';
import { UnknownProvisioningStrategy } from '@src/modules/provisioning/strategy/unknown/unknown.strategy';

@Injectable()
export class ProvisioningUc {
	constructor(
		private readonly userUc: UserUc,
		private readonly schoolUc: SchoolUc,
		private readonly roleUc: RoleUc,
		private readonly systemUc: SystemUc,
		private readonly unknownStrategy: UnknownProvisioningStrategy,
		private readonly logger: Logger
	) {
		this.logger.setContext(ProvisioningUc.name);
	}

	async process(sub: string, systemId: string): Promise<void> {
		const system: SystemDto = await this.systemUc.findById(systemId);
		if (!system) {
			this.logger.error(`System with id ${systemId} was not found.`);
			throw new ProvisioningException(`System with id "${systemId}" does not exist.`, 'ProvisioningSystemNotFound');
		}

		let strategy: ProvisioningStrategy<IProviderResponse>;
		switch (system.provisioningStrategy) {
			case SystemProvisioningStrategy.UNKNOWN:
				strategy = this.unknownStrategy;
				break;
			default:
				this.logger.error(`Missing provisioning strategy for system with id ${systemId}`);
				throw new ProvisioningException(
					`Provisioning Strategy "${system.provisioningStrategy ?? 'undefined'}" is not defined.`,
					'UnknownProvisioningStrategy'
				);
		}

		const provisioningDto: ProvisioningDto = await strategy.apply();

		if (provisioningDto.schoolDto) {
			await this.schoolUc.saveSchool(provisioningDto.schoolDto);
		}

		if (provisioningDto.userDto) {
			await this.userUc.save(provisioningDto.userDto);
		}
	}
}
