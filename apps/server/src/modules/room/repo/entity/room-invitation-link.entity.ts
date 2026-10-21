import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkProps } from '../../domain/do/room-invitation-link.do';

@Entity({ tableName: 'room-invitation-links' })
@Unique({
	name: 'roomInvitationTokenUniqueIndex',
	properties: ['invitationToken'],
	options: { partialFilterExpression: { invitationToken: { $type: 'string' } } },
})
export class RoomInvitationLinkEntity extends BaseEntityWithTimestamps implements RoomInvitationLinkProps {
	@Property({ nullable: true })
	invitationToken?: string;

	@Property({ nullable: false })
	title!: string;

	@Property()
	isUsableByExternalPersons!: boolean;

	@Property()
	isUsableByStudents!: boolean;

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
