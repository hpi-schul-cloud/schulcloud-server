import { EntityId } from '@shared/domain/types';

// This interface is invalid and should be removed
export interface CopyFileDomainObjectProps {
	id?: EntityId | undefined;
	sourceId: EntityId;
	name: string;
}
