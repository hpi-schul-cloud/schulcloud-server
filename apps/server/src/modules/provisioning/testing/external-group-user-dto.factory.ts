import { RoleName } from '@modules/role';
import { UUID } from 'bson';
import { Factory } from 'fishery';
import { ExternalGroupUserDto } from '../dto';

export const externalGroupUserDtoFactory = Factory.define<ExternalGroupUserDto>(
	() =>
		new ExternalGroupUserDto({
			externalUserId: new UUID().toString(),
			roleName: RoleName.TEACHER,
		})
);
