import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { RoleName } from '@modules/role';
import { RoomInvitationLink, RoomInvitationLinkProps } from './room-invitation-link.do';
import { roomInvitationLinkFactory } from '@modules/room/testing/room-invitation-link.factory';

describe('RoomInvitationLink', () => {
    let roomInvitationLink: RoomInvitationLink;
    const roomInvitationLinkId: EntityId = 'roomInvitationLinkId';
    const roomInvitationLinkProps: RoomInvitationLinkProps = {
        id: roomInvitationLinkId,
        title: 'Conference Room Invitation Link',
        restrictedToSchoolId: new ObjectId().toHexString(),
        isOnlyForTeachers: true,
        activeUntil: new Date('2024-12-31'),
        startingRole: RoleName.ROOMAPPLICANT,
        roomId: new ObjectId().toHexString(),
        createdById: new ObjectId().toHexString(),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
    };

    beforeEach(() => {
        roomInvitationLink = new RoomInvitationLink(roomInvitationLinkProps);
    });

    it('should props without domainObject', () => {
        const mockDomainObject = roomInvitationLinkFactory.build();
        // this tests the hotfix for the mikro-orm issue
        // eslint-disable-next-line @typescript-eslint/dot-notation
        roomInvitationLink['domainObject'] = mockDomainObject;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { domainObject, ...props } = roomInvitationLink.getProps();

        expect(domainObject).toEqual(undefined);
        expect(props).toEqual(roomInvitationLinkProps);
    });

    it('should get and set title', () => {
        expect(roomInvitationLink.title).toBe('Conference Room Invitation Link');
        roomInvitationLink.title = 'Meeting Room Invitation Link';
        expect(roomInvitationLink.title).toBe('Meeting Room Invitation Link');
    });

    it('should get and set restrictedToSchoolId', () => {
        expect(roomInvitationLink.restrictedToSchoolId).toBeDefined();
        const newRestrictedToSchoolId = new ObjectId().toHexString();
        roomInvitationLink.restrictedToSchoolId = newRestrictedToSchoolId;
        expect(roomInvitationLink.restrictedToSchoolId).toEqual(newRestrictedToSchoolId);
    });

    it('should get and set isOnlyForTeachers', () => {
        expect(roomInvitationLink.isOnlyForTeachers).toBe(true);
        roomInvitationLink.isOnlyForTeachers = false;
        expect(roomInvitationLink.isOnlyForTeachers).toBe(false);
    });

    it('should get and set activeUntil', () => {
        expect(roomInvitationLink.activeUntil).toEqual(new Date('2024-12-31'));
        const newActiveUntil = new Date('2024-11-30');
        roomInvitationLink.activeUntil = newActiveUntil;
        expect(roomInvitationLink.activeUntil).toEqual(newActiveUntil);
    });

    it('should get and set startingRole', () => {
        expect(roomInvitationLink.startingRole).toEqual(RoleName.ROOMAPPLICANT);
        const newStartingRole = RoleName.ROOMADMIN;
        roomInvitationLink.startingRole = newStartingRole;
        expect(roomInvitationLink.startingRole).toEqual(newStartingRole);
    });

    it('should get and set roomId', () => {
        expect(roomInvitationLink.roomId).toBeDefined();
        const newRoomId = new ObjectId().toHexString();
        roomInvitationLink.roomId = newRoomId;
        expect(roomInvitationLink.roomId).toEqual(newRoomId);
    });

    it('should get and set createdById', () => {
        expect(roomInvitationLink.createdById).toBeDefined();
        const newCreatedById = new ObjectId().toHexString();
        roomInvitationLink.createdById = newCreatedById;
        expect(roomInvitationLink.createdById).toEqual(newCreatedById);
    });

    it('should get createdAt', () => {
        const expectedCreatedAt = new Date('2024-01-01');
        expect(roomInvitationLink.createdAt).toEqual(expectedCreatedAt);
    });

    it('should get updatedAt', () => {
        const expectedUpdatedAt = new Date('2024-01-02');
        expect(roomInvitationLink.updatedAt).toEqual(expectedUpdatedAt);
    });
});
