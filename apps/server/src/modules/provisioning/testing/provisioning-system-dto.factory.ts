import { ProvisioningSystemDto } from '@modules/provisioning';
import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

export const provisioningSystemDtoFactory = Factory.define<ProvisioningSystemDto, ProvisioningSystemDto>(
	() =>
		new ProvisioningSystemDto({
			systemId: new ObjectId().toHexString(),
			provisioningStrategy: SystemProvisioningStrategy.TSP,
		})
);
