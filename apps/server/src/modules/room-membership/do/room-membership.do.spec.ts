import { EntityId } from '@shared/domain/types';
import { roomMembershipFactory } from '../testing';
import { RoomMembership, RoomMembershipProps } from './room-membership.do';

describe('RoomMembership', () => {
	let roomMembership: RoomMembership;
	const roomMemberId: EntityId = 'roomMemberId';
	const roomMembershipProps: RoomMembershipProps = {
		id: roomMemberId,
		roomId: 'roomId',
		userGroupId: 'userGroupId',
		schoolId: 'schoolId',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	};

	beforeEach(() => {
		roomMembership = new RoomMembership(roomMembershipProps);
	});

	it('should props without domainObject', () => {
		const mockDomainObject = roomMembershipFactory.build();
		// this tests the hotfix for the mikro-orm issue
		// eslint-disable-next-line @typescript-eslint/dot-notation
		roomMembership['domainObject'] = mockDomainObject;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...props } = roomMembership.getProps();

		expect(domainObject).toEqual(undefined);
		expect(props).toEqual(roomMembershipProps);
	});

	it('should get roomId', () => {
		expect(roomMembership.roomId).toEqual(roomMembershipProps.roomId);
	});

	it('should get userGroupId', () => {
		expect(roomMembership.userGroupId).toEqual(roomMembershipProps.userGroupId);
	});

	it('should get schoolId', () => {
		expect(roomMembership.schoolId).toEqual(roomMembershipProps.schoolId);
	});
});
