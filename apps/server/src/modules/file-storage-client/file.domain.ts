import { EntityId, FileRecordParentType } from '@shared/domain';

export interface IFileDomainObjectProps {
	id: EntityId;
	name: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	schoolId: EntityId;
}

// todo: Extends BaseDomainObject
export class FileDomainObject {
	id: EntityId;

	name: string;

	parentType: FileRecordParentType;

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
