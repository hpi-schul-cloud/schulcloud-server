import { ProvisioningDto } from '@modules/provisioning';
import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';

export const provisioningDtoFactory = Factory.define<ProvisioningDto, ProvisioningDto>(
	() =>
		new ProvisioningDto({
			externalUserId: new ObjectId().toHexString(),
		})
);
