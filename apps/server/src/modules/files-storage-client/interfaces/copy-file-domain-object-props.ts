import { EntityId } from '@shared/domain';

export interface CopyFileDomainObjectProps {
	id?: EntityId | undefined;
	sourceId: EntityId;
	name: string;
}
