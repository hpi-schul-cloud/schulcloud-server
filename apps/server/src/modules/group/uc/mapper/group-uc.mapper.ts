import { Group } from '../../domain';
import { ResolvedGroupDto, ResolvedGroupUser } from '../dto';

export class GroupUcMapper {
	public static mapToResolvedGroupDto(group: Group, resolvedGroupUsers: ResolvedGroupUser[]): ResolvedGroupDto {
		const mapped: ResolvedGroupDto = new ResolvedGroupDto({
			id: group.id,
			name: group.name,
			type: group.type,
			externalSource: group.externalSource,
			users: resolvedGroupUsers,
			organizationId: group.organizationId,
			validPeriod: group.validPeriod,
		});

		return mapped;
	}
}
