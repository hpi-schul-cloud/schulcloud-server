import { EntityId } from '@shared/domain';
import { FileRecordParamsParentTypeEnum } from '../fileStorageApi/v3';
import { IFileDomainObjectProps } from '../interfaces';

export class FileDto {
	id: EntityId;

	name: string;

	parentType: FileRecordParamsParentTypeEnum;

	parentId: EntityId;

	schoolId: EntityId;

	constructor(props: IFileDomainObjectProps) {
		this.id = props.id;
		this.name = props.name;
		this.parentType = props.parentType;
		this.parentId = props.parentId;
		this.schoolId = props.schoolId;
	}
}
