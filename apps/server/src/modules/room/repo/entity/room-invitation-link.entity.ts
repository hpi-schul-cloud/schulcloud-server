import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkProps } from '../../domain/do/room-invitation-link.do';

@Entity({ tableName: 'room-invition-links' })
export class RoomInvitationLinkEntity extends BaseEntityWithTimestamps implements RoomInvitationLinkProps {
	@Property({ nullable: false })
	title!: string;

	@Property()
	isOnlyForTeachers!: boolean;

	@Property()
	activeUntil?: Date;

	@Property()
	requiresConfirmation!: boolean;

	@Property()
	restrictedToCreatorSchool!: boolean;

	@Property()
	creatorUserId!: EntityId;

	@Property()
	creatorSchoolId!: EntityId;

	@Property()
	roomId!: EntityId;

	@Property({ persist: false })
	domainObject: RoomInvitationLink | undefined;
}
