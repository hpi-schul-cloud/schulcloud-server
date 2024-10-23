import { EntityId } from '@shared/domain/types';
import { roomMemberFactory } from '../testing';
import { RoomMember, RoomMemberProps } from './room-member.do';

describe('RoomMember', () => {
	let roomMember: RoomMember;
	const roomMemberId: EntityId = 'roomMemberId';
	const roomMemberProps: RoomMemberProps = {
		id: roomMemberId,
		roomId: 'roomId',
		userGroupId: 'userGroupId',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	};

	beforeEach(() => {
		roomMember = new RoomMember(roomMemberProps);
	});

	it('should props without domainObject', () => {
		const mockDomainObject = roomMemberFactory.build();
		// this tests the hotfix for the mikro-orm issue
		// eslint-disable-next-line @typescript-eslint/dot-notation
		roomMember['domainObject'] = mockDomainObject;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...props } = roomMember.getProps();

		expect(domainObject).toEqual(undefined);
		expect(props).toEqual(roomMemberProps);
	});

	it('should get roomId', () => {
		expect(roomMember.roomId).toEqual(roomMemberProps.roomId);
	});

	it('should get userGroupId', () => {
		expect(roomMember.userGroupId).toEqual(roomMemberProps.userGroupId);
	});
});
