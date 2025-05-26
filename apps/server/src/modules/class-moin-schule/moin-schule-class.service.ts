import { Group, GroupService } from '@modules/group';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MoinSchuleClassService {
	constructor(private readonly groupService: GroupService) {}

	public findByUserId(userId: EntityId): Group[] {
		return [];
	}

	// Add your service methods here
}
