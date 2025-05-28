import { EntityId } from '@shared/domain/types';
import { StepReport } from './report';

export interface SagaType {
	userDeletion: { params: { userId: EntityId }; result: StepReport[] };

	roomCopy: {
		params: { userId: EntityId; roomId: EntityId; newName?: string };
		result: { roomCopied: { id: EntityId; name: string }; boardsCopied: { id: EntityId; title: string }[] };
	};

	// add more, e.g:
	// saga1: { params: { id: number }; result: string };
	// saga2: { params: { name: string }; result: boolean };
}
