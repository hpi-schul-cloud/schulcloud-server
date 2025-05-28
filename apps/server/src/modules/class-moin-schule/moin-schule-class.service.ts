import { Group, GroupService, GroupTypes } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class MoinSchuleClassService {
	constructor(private readonly groupService: GroupService) {}

	public async findByUserId(userId: EntityId): Promise<Group[]> {
		const filter = { userId, groupTypes: [GroupTypes.CLASS] };

		const groups = await this.groupService.findGroups(filter);

		return groups.data;
	}
}
