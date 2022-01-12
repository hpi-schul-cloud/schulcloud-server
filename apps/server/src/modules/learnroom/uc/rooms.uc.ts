import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';

export interface Board {
	content: [];
}

@Injectable()
export class RoomsUc {
	getBoard(roomId: EntityId, user: EntityId): Promise<Board> {
		return Promise.resolve({ content: [] });
	}
}
