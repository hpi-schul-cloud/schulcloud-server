import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';
import { RoomInvitationLinkDomainMapper } from './room-invitation-link-domain.mapper';
import { RoleName } from '@modules/role';
import { RoomInvitationLink, RoomInvitationLinkProps } from '../domain/do/room-invitation-link.do';
import { roomInvitationLinkEntityFactory } from '../testing/room-invitation-link-entity.factory';

describe('RoomInvitationLinkDomainMapper', () => {
    describe('mapEntityToDo', () => {
        it('should correctly map RoomInvitationLinkEntity to RoomInvitationLink domain object', () => {
            const roomInvitationLinkEntity = {
                id: '1',
                title: 'Test Room Invitation Link',
                restrictedToSchoolId: 'restricted-to-school-id',
                isOnlyForTeachers: true,
                activeUntil: new Date('2023-12-31'),
                startingRole: RoleName.ROOMAPPLICANT,
                roomId: 'room-id',
                createdById: 'created-by-id',
            } as RoomInvitationLinkEntity;

            const result = RoomInvitationLinkDomainMapper.mapEntityToDo(roomInvitationLinkEntity);

            expect(result).toBeInstanceOf(RoomInvitationLink);
            expect(result.getProps()).toEqual({
                id: '1',
                title: 'Test Room Invitation Link',
                restrictedToSchoolId: 'restricted-to-school-id',
                isOnlyForTeachers: true,
                activeUntil: new Date('2023-12-31'),
                startingRole: RoleName.ROOMAPPLICANT,
                roomId: 'room-id',
                createdById: 'created-by-id',
            });
        });

        it('should return existing domainObject if present, regardless of entity properties', () => {
            const existingRoomInvitationLink = new RoomInvitationLink({
                id: '1',
                title: 'Existing Room Invitation Link',
                restrictedToSchoolId: new ObjectId().toHexString(),
                isOnlyForTeachers: false,
                activeUntil: new Date('2023-01-01'),
                startingRole: RoleName.ROOMAPPLICANT,
                roomId: new ObjectId().toHexString(),
                createdById: new ObjectId().toHexString(),
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            });

            const roomInvitationLinkEntity = {
                id: '2',
                title: 'Test Room Invitation Link',
                restrictedToSchoolId: new ObjectId().toHexString(),
                isOnlyForTeachers: true,
                activeUntil: new Date('2023-12-31'),
                startingRole: RoleName.ROOMAPPLICANT,
                roomId: new ObjectId().toHexString(),
                domainObject: existingRoomInvitationLink,
            } as RoomInvitationLinkEntity;

            const result = RoomInvitationLinkDomainMapper.mapEntityToDo(roomInvitationLinkEntity);

            expect(result).toBe(existingRoomInvitationLink);
            expect(result).toBeInstanceOf(RoomInvitationLink);
            expect(result.getProps()).toEqual({
                id: '1',
                title: 'Existing Room Invitation Link',
                restrictedToSchoolId: existingRoomInvitationLink.restrictedToSchoolId,
                isOnlyForTeachers: false,
                activeUntil: new Date('2023-01-01'),
                startingRole: RoleName.ROOMAPPLICANT,
                roomId: existingRoomInvitationLink.roomId,
                createdById: existingRoomInvitationLink.createdById,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            });
            expect(result.getProps().id).toBe('1');
            expect(result.getProps().id).not.toBe(roomInvitationLinkEntity.id);
        });

        it('should wrap the actual entity reference in the domain object', () => {
            const roomInvitationLinkEntity = {
                id: '1',
                title: 'Test Room Invitation Link',
                restrictedToSchoolId: new ObjectId().toHexString(),
                isOnlyForTeachers: true,
                activeUntil: new Date('2023-12-31'),
                startingRole: RoleName.ROOMAPPLICANT,
                roomId: new ObjectId().toHexString(),
                createdById: new ObjectId().toHexString(),
            } as RoomInvitationLinkEntity;

            const result = RoomInvitationLinkDomainMapper.mapEntityToDo(roomInvitationLinkEntity);
            // @ts-expect-error check necessary
            const { props } = result;

            expect(props === roomInvitationLinkEntity).toBe(true);
        });
    });

    describe('mapDoToEntity', () => {
        describe('when domain object props are instanceof RoomInvitationLinkEntity', () => {
            it('should return the entity', () => {
                const roomInvitationLinkEntity = roomInvitationLinkEntityFactory.build();
                const roomInvitationLink = new RoomInvitationLink(roomInvitationLinkEntity);

                const result = RoomInvitationLinkDomainMapper.mapDoToEntity(roomInvitationLink);

                expect(result).toBe(roomInvitationLinkEntity);
            });
        });

        describe('when domain object props are not instanceof RoomInvitationLinkEntity', () => {
            it('should convert them to an entity and return it', () => {
                const roomInvitationLinkEntity: RoomInvitationLinkProps = {
                    id: '66d581c3ef74c548a4efea1d',
                    title: 'Test Room Invitation Link #1',
                    restrictedToSchoolId: new ObjectId().toHexString(),
                    isOnlyForTeachers: true,
                    activeUntil: new Date('2023-12-31'),
                    startingRole: RoleName.ROOMVIEWER,
                    roomId: new ObjectId().toHexString(),
                    createdById: new ObjectId().toHexString(),
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01'),
                };
                const roomInvitationLink = new RoomInvitationLink(roomInvitationLinkEntity);

                const result = RoomInvitationLinkDomainMapper.mapDoToEntity(roomInvitationLink);

                expect(result).toBeInstanceOf(RoomInvitationLinkEntity);
                expect(result).toMatchObject(roomInvitationLinkEntity);
            });
        });
    });
});
