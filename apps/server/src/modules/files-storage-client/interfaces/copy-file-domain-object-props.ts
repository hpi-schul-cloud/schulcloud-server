import { EntityId } from '@shared/domain/types/entity-id';

export interface ICopyFileDomainObjectProps {
	id?: EntityId | undefined;
	sourceId: EntityId;
	name: string;
}
