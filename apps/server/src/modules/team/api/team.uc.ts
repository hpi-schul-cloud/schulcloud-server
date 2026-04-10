import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class TeamUc {
	public createRoomWithTeamMembers(userId: EntityId, teamId: EntityId): Promise<{ roomId: string }> {
		// TODO: Implement export room logic
		return Promise.resolve({ roomId: '1234123412341234' });
	}
}
