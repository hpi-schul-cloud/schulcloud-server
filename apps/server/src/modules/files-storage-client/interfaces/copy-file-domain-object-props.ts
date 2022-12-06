import { EntityId } from '@shared/domain';

export interface ICopyFileDomainObjectProps {
	id?: EntityId | undefined;
	sourceId: EntityId;
	name: string;
}
