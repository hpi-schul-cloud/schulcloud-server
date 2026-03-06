import { RoomAuthorizable } from './room-authorizable.do';
import { RoomInvitationLinkAuthorizable } from './room-invitation-link-authorizable.do';
import { RoomInvitationLink } from '@modules/room/domain/do/room-invitation-link.do';

describe('RoomInvitationLinkAuthorizable', () => {
	const setup = () => {
		const roomInvitationLink = new RoomInvitationLink({
			id: 'linkId',
			roomId: 'roomId',
			title: 'linkTitle',
			requiresConfirmation: false,
			creatorUserId: 'creatorUserId',
			creatorSchoolId: 'creatorSchoolId',
			isUsableByStudents: true,
			isUsableByExternalPersons: false,
			restrictedToCreatorSchool: true,
			activeUntil: new Date(Date.now() + 1000 * 60 * 60), // active for 1 hour
		});

		const roomConfig = {
			featureRoomCopyEnabled: true,
			featureRoomLinkInvitationExternalPersonsEnabled: false,
			roomMemberAddExternalPersonRequirementsUrl: null,
			featureRoomAddExternalPersonsEnabled: false,
			featureRoomRegisterExternalPersonsEnabled: false,
			featureAdministrateRoomsEnabled: true,
			roomMemberInfoUrl: 'http://example.com/room-member-info',
		};

		const roomAuthorizable = new RoomAuthorizable('roomId', [], 'schoolId');
		const roomInvitationLinkAuthorizable = new RoomInvitationLinkAuthorizable(
			roomAuthorizable,
			roomInvitationLink,
			'schoolName',
			roomConfig
		);

		return { roomInvitationLinkAuthorizable, roomConfig, roomInvitationLink };
	};

	it('should provide schoolId', () => {
		const { roomInvitationLinkAuthorizable } = setup();

		expect(roomInvitationLinkAuthorizable.schoolId).toEqual('schoolId');
	});

	it('should provide config', () => {
		const { roomInvitationLinkAuthorizable, roomConfig } = setup();

		expect(roomInvitationLinkAuthorizable.config).toEqual(roomConfig);
	});

	it('should provide roomInvitationLink', () => {
		const { roomInvitationLinkAuthorizable, roomInvitationLink } = setup();

		expect(roomInvitationLinkAuthorizable.roomInvitationLink).toEqual(roomInvitationLink);
	});
});
