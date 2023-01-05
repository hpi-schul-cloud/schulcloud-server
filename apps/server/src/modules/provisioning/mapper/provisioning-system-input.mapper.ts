import { ProvisioningSystemInputDto } from '@src/modules/provisioning/dto/provisioning-system-input.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

export class ProvisioningSystemInputMapper {
	static mapToInternal(dto: SystemDto) {
		return new ProvisioningSystemInputDto({
			systemId: dto.id || '',
			provisioningStrategy: dto.provisioningStrategy || SystemProvisioningStrategy.UNDEFINED,
			provisioningUrl: dto.provisioningUrl || undefined,
		});
	}
}
