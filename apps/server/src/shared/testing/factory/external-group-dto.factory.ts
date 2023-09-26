import { RoleName } from '@shared/domain';
import { ObjectId } from 'bson';
import { ExternalGroupDto } from '@src/modules/provisioning/dto';
import { GroupTypes } from '@src/modules/group';
import { BaseFactory } from './base.factory';

export const externalGroupDtoFactory = BaseFactory.define<ExternalGroupDto, ExternalGroupDto>(
	ExternalGroupDto,
	({ sequence }) => {
		return {
			externalId: new ObjectId().toHexString(),
			name: `Group ${sequence}`,
			type: GroupTypes.CLASS,
			users: [
				{
					externalUserId: new ObjectId().toHexString(),
					roleName: RoleName.TEACHER,
				},
				{
					externalUserId: new ObjectId().toHexString(),
					roleName: RoleName.STUDENT,
				},
			],
			from: new Date(2023, 1),
			until: new Date(2023, 6),
			externalOrganizationId: new ObjectId().toHexString(),
		};
	}
);
