import { EntityId } from '@shared/domain/types/entity-id';

export class GroupUser {
	userId: EntityId;

	roleId: EntityId;

	constructor(props: GroupUser) {
		this.userId = props.userId;
		this.roleId = props.roleId;
	}
}
