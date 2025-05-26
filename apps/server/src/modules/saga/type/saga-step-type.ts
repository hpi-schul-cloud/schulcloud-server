import { EntityId } from '@shared/domain/types';
import { StepReport } from './report';
// import { ExternalReference } from './external-reference';

export interface StepType {
	deleteUserData: { params: { userId: EntityId }; result: StepReport };

	copyRoom: {
		params: { userId: EntityId; roomId: EntityId; newName?: string };
		result: { id: EntityId; name: string };
	};

	copyRoomBoards: {
		params: { userId: EntityId; sourceRoomId: EntityId; targetRoomId: EntityId };
		result: { id: EntityId; title: string }[];
	};
}
