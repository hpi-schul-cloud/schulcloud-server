import { EntityId } from '@shared/domain/types';

export class GroupInfoDto {
	id: EntityId;

	name: string;

	constructor(props: GroupInfoDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
