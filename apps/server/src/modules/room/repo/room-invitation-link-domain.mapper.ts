import { RoomInvitationLink } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';

export class RoomInvitationLinkDomainMapper {
    static mapEntityToDo(roomInvitationLinkEntity: RoomInvitationLinkEntity): RoomInvitationLink {
        // check identity map reference
        if (roomInvitationLinkEntity.domainObject) {
            return roomInvitationLinkEntity.domainObject;
        }

        const roomInvitationLink = new RoomInvitationLink(roomInvitationLinkEntity);

        // attach to identity map
        roomInvitationLinkEntity.domainObject = roomInvitationLink;

        return roomInvitationLink;
    }

    static mapDoToEntity(roomInvitationLink: RoomInvitationLink): RoomInvitationLinkEntity {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { props } = roomInvitationLink;

        if (!(props instanceof RoomInvitationLinkEntity)) {
            const entity = new RoomInvitationLinkEntity();
            Object.assign(entity, props);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            roomInvitationLink.props = entity;

            return entity;
        }

        return props;
    }
}
