import { EntityId } from '@shared/domain/types/entity-id';
import { FileRecordParentType } from '@shared/infra/rabbitmq/exchange/files-storage';
import { IFileDomainObjectProps } from '../interfaces/file-domain-object-props';

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
