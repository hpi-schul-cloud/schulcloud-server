import { EntityId } from '@shared/domain/types';

export class ClassInfoDto {
	id: EntityId;

	name: string;

	constructor(props: ClassInfoDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
