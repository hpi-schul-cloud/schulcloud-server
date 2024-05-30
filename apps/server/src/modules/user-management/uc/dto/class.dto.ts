import { EntityId } from '@shared/domain/types';

export class ClassDto {
	public id: EntityId;

	public name: string;

	constructor(props: ClassDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
