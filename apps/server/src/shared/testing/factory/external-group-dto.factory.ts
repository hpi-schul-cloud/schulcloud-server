import { GroupTypes } from '@modules/group';
import { ExternalGroupDto } from '@modules/provisioning/dto';
import { RoleName } from '@shared/domain/interface';
import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';

export const externalGroupDtoFactory = Factory.define<ExternalGroupDto, ExternalGroupDto>(({ sequence }) => {
	return {
		externalId: new ObjectId().toHexString(),
		name: `Group ${sequence}`,
		type: GroupTypes.CLASS,
		user: {
			externalUserId: new ObjectId().toHexString(),
			roleName: RoleName.TEACHER,
		},
		otherUsers: [
			{
				externalUserId: new ObjectId().toHexString(),
				roleName: RoleName.STUDENT,
			},
		],
		from: new Date(2023, 1),
		until: new Date(2023, 6),
	};
});
