import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@shared/domain/interface';
import { ExternalUserDto } from '@src/modules/provisioning';
import { Factory } from 'fishery';

export const externalUserDtoFactory = Factory.define<ExternalUserDto, ExternalUserDto>(
	({ sequence }) =>
		new ExternalUserDto({
			externalId: new ObjectId().toHexString(),
			firstName: `Firstname ${sequence}`,
			lastName: `Lastname ${sequence}`,
			email: `Email ${sequence}`,
			roles: [RoleName.STUDENT],
		})
);
