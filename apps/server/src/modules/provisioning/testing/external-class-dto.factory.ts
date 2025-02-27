import { ExternalClassDto } from '@modules/provisioning';
import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';

export const externalClassDtoFactory = Factory.define<ExternalClassDto, ExternalClassDto>(
	({ sequence }) =>
		new ExternalClassDto({
			externalId: new ObjectId().toHexString(),
			name: `external Class ${sequence}`,
		})
);
