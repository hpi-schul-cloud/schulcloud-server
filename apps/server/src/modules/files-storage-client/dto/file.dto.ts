import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';
import { IFileDomainObjectProps } from '../interfaces';

export class FileDto {
	id: EntityId;

	name: string;

	parentType: FileRecordParentType;

	parentId: EntityId;

	constructor(props: IFileDomainObjectProps) {
		this.id = props.id;
		this.name = props.name;
		this.parentType = props.parentType;
		this.parentId = props.parentId;
	}
}
