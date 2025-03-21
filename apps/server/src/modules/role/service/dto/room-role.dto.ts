import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomRole } from '../../domain';

export class RoomRoleDto {
	id: EntityId;

	name: RoomRole;

	permissions?: Permission[];

	constructor(props: RoomRoleDto) {
		this.id = props.id;
		this.name = props.name;
		this.permissions = props.permissions;
	}
}
