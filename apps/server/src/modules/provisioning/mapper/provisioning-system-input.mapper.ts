import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { ProvisioningSystemDto } from '../dto';

export class ProvisioningSystemInputMapper {
	static mapToInternal(dto: SystemDto) {
		return new ProvisioningSystemDto({
			systemId: dto.id || '',
			provisioningStrategy: dto.provisioningStrategy || SystemProvisioningStrategy.UNDEFINED,
			provisioningUrl: dto.provisioningUrl || undefined,
		});
	}
}
