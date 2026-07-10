import { type EntityId } from '@shared/domain/types';

export class GroupUser {
	public userId: EntityId;

	public roleId: EntityId;

	constructor(props: GroupUser) {
		this.userId = props.userId;
		this.roleId = props.roleId;
	}
}
