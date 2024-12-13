import { UUID } from 'bson';
import { Factory } from 'fishery';
import { GroupTypes } from '../../group';
import { ExternalGroupDto } from '../dto';
import { externalGroupUserDtoFactory } from './external-group-user-dto.factory';

export const externalGroupDtoFactory = Factory.define<ExternalGroupDto>(
	({ sequence }) =>
		new ExternalGroupDto({
			type: GroupTypes.CLASS,
			name: `External Group ${sequence}`,
			externalId: new UUID().toString(),
			user: externalGroupUserDtoFactory.build(),
			otherUsers: externalGroupUserDtoFactory.buildList(2),
			from: new Date(),
			until: new Date(),
		})
);
