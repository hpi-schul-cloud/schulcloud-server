import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink, RoomInvitationLinkProps } from './room-invitation-link.do';
import { roomInvitationLinkTestFactory } from '@modules/room/testing/room-invitation-link.test.factory';

describe('RoomInvitationLink', () => {
	let roomInvitationLink: RoomInvitationLink;
	const roomInvitationLinkId: EntityId = 'roomInvitationLinkId';
	const roomInvitationLinkProps: RoomInvitationLinkProps = {
		id: roomInvitationLinkId,
		title: 'Conference Room Invitation Link',
		restrictedToCreatorSchool: true,
		isOnlyForTeachers: true,
		activeUntil: new Date('2024-12-31'),
		requiresConfirmation: true,
		roomId: new ObjectId().toHexString(),
		creatorUserId: new ObjectId().toHexString(),
		creatorSchoolId: new ObjectId().toHexString(),
	};

	beforeEach(() => {
		roomInvitationLink = new RoomInvitationLink(roomInvitationLinkProps);
	});

	it('should props without domainObject', () => {
		const mockDomainObject = roomInvitationLinkTestFactory.build();
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

	it('should get and set restrictedToCreatorSchool', () => {
		expect(roomInvitationLink.restrictedToCreatorSchool).toBe(true);
		roomInvitationLink.restrictedToCreatorSchool = false;
		expect(roomInvitationLink.restrictedToCreatorSchool).toBe(false);
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

	it('should get and set requiresConfirmation', () => {
		expect(roomInvitationLink.requiresConfirmation).toEqual(true);
		roomInvitationLink.requiresConfirmation = false;
		expect(roomInvitationLink.requiresConfirmation).toEqual(false);
	});
});
