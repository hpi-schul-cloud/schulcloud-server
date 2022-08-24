import { EntityId } from '@shared/domain';

export interface ICopyFileDomainObjectProps {
	id: EntityId;
	sourceId: EntityId;
	name: string;
}
