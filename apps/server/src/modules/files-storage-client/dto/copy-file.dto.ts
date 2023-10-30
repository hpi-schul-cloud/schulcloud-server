import { EntityId } from '@shared/domain/types/entity-id';
import { ICopyFileDomainObjectProps } from '../interfaces/copy-file-domain-object-props';

export class CopyFileDto {
	id?: EntityId | undefined;

	sourceId: EntityId;

	name: string;

	constructor(data: ICopyFileDomainObjectProps) {
		this.id = data.id;
		this.sourceId = data.sourceId;
		this.name = data.name;
	}
}
