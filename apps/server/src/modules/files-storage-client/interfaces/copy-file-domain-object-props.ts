import { EntityId } from '@shared/domain/types';

export interface CopyFileDomainObjectProps {
	id?: EntityId | undefined;
	sourceId: EntityId;
	name: string;
}
