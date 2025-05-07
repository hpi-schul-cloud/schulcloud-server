import { RoleName } from '@modules/role';
import { UUID } from 'bson';
import { Factory } from 'fishery';
import { ExternalUserDto } from '../dto';

export const externalUserDtoFactory = Factory.define<ExternalUserDto>(
	() =>
		new ExternalUserDto({
			externalId: new UUID().toString(),
			email: 'external@schul-cloud.org',
			birthday: new Date(1998, 11, 18),
			firstName: 'ex',
			lastName: 'ternal',
			roles: [RoleName.TEACHER],
		})
);
