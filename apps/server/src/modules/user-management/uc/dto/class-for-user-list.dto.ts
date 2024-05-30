import { EntityId } from '@shared/domain/types';

export class ClassForUserListDto {
	public id: EntityId;

	public name: string;

	constructor(props: ClassForUserListDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
