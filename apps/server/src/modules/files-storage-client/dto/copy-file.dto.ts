import { EntityId } from '@shared/domain';
import { ICopyFileDomainObjectProps } from '../interfaces';

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
