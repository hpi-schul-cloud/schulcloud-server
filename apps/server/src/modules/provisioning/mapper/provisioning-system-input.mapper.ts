import { System } from '@modules/system';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningSystemDto } from '../dto';

export class ProvisioningSystemInputMapper {
	static mapToInternal(dto: System): ProvisioningSystemDto {
		return new ProvisioningSystemDto({
			systemId: dto.id,
			provisioningStrategy: dto.provisioningStrategy || SystemProvisioningStrategy.UNDEFINED,
			provisioningUrl: dto.provisioningUrl,
		});
	}
}
