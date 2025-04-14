import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { RoomRole } from '@modules/role';
import { RoomInvitationLink, RoomInvitationLinkProps } from '../../domain/do/room-invitation-link.do';

@Entity({ tableName: 'room-invition-links' })
export class RoomInvitationLinkEntity extends BaseEntityWithTimestamps implements RoomInvitationLinkProps {
	@Property({ nullable: false })
	title!: string;

	@Property({ nullable: true })
	restrictedToSchoolId?: EntityId;

	@Property()
	isOnlyForTeachers!: boolean;

	@Property()
	activeUntil?: Date;

	@Property()
	startingRole!: RoomRole;

	@Property()
	createdById!: EntityId;

	@Property()
	roomId!: EntityId;

	@Property({ persist: false })
	domainObject: RoomInvitationLink | undefined;
}
