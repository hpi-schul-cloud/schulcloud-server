import { type EntityId } from '@shared/domain/types';
import { type CopyFileDomainObjectProps } from '../interfaces';

export class CopyFileDto {
	id?: EntityId | undefined;

	sourceId: EntityId;

	name: string;

	constructor(data: CopyFileDomainObjectProps) {
		this.id = data.id;
		this.sourceId = data.sourceId;
		this.name = data.name;
	}
}
