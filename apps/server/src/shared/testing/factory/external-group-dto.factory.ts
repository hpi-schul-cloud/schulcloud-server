import { GroupTypes } from '@modules/group';
import { ExternalGroupDto } from '@modules/provisioning/dto';
import { RoleName } from '@shared/domain/interface';
import { ObjectId } from 'bson';
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
