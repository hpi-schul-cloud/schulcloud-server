import { FileRecordParentType } from '@infra/rabbitmq';
import { EntityId } from '@shared/domain/types';
import { FileDomainObjectProps } from '../interfaces';

export class FileDto {
	id: EntityId;

	name: string;

	parentType: FileRecordParentType;

	parentId: EntityId;

	createdAt?: Date;

	updatedAt?: Date;

	constructor(props: FileDomainObjectProps) {
		this.id = props.id;
		this.name = props.name;
		this.parentType = props.parentType;
		this.parentId = props.parentId;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}
