import { Injectable } from '@nestjs/common';
import {
	RoomInvitationLink,
	RoomInvitationLinkDto,
	RoomInvitationLinkUpdateProps,
} from '../do/room-invitation-link.do';
import { RoomInvitationLinkRepo } from '../../repo';
import { ObjectId } from 'bson';

@Injectable()
export class RoomInvitationLinkService {
	constructor(private readonly roomInvitationLinkRepo: RoomInvitationLinkRepo) {}

	public async createLink(props: RoomInvitationLinkDto): Promise<RoomInvitationLink> {
		const roomInvitationLink = new RoomInvitationLink({ id: new ObjectId().toHexString(), ...props });
		await this.roomInvitationLinkRepo.save(roomInvitationLink);
		return roomInvitationLink;
	}

	public async updateLink(props: RoomInvitationLinkUpdateProps): Promise<RoomInvitationLink> {
		const roomInvitationLink = await this.roomInvitationLinkRepo.findById(props.id);
		roomInvitationLink.title = props.title ?? roomInvitationLink.title;
		roomInvitationLink.isOnlyForTeachers = props.isOnlyForTeachers ?? roomInvitationLink.isOnlyForTeachers;
		roomInvitationLink.activeUntil = props.activeUntil ?? roomInvitationLink.activeUntil;
		roomInvitationLink.requiresConfirmation = props.requiresConfirmation ?? roomInvitationLink.requiresConfirmation;
		roomInvitationLink.restrictedToCreatorSchool =
			props.restrictedToCreatorSchool ?? roomInvitationLink.restrictedToCreatorSchool;

		await this.roomInvitationLinkRepo.save(roomInvitationLink);
		return roomInvitationLink;
	}

	public async findLinkByRoomId(roomId: string): Promise<RoomInvitationLink[]> {
		const links = await this.roomInvitationLinkRepo.findByRoomId(roomId);
		return links;
	}

	public async deleteLink(linkId: string): Promise<void> {
		await this.roomInvitationLinkRepo.delete(linkId);
	}

	public async findById(linkId: string): Promise<RoomInvitationLink> {
		const roomInvitationLink = await this.roomInvitationLinkRepo.findById(linkId);
		return roomInvitationLink;
	}
}
