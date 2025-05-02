import { Injectable } from '@nestjs/common';
import { RoomInvitationLinkRepo } from '../../repo';
import { RoomInvitationLink, RoomInvitationLinkDto } from '../do/room-invitation-link.do';
import { RoomInvitationLinkFactory } from '../factory/room-invitation-link.factory';

@Injectable()
export class RoomInvitationLinkService {
	constructor(private readonly roomInvitationLinkRepo: RoomInvitationLinkRepo) {}

	public async createLink(props: RoomInvitationLinkDto): Promise<RoomInvitationLink> {
		const roomInvitationLink = RoomInvitationLinkFactory.createInvitationLink(props);
		await this.roomInvitationLinkRepo.save(roomInvitationLink);
		return roomInvitationLink;
	}

	public async saveLink(link: RoomInvitationLink): Promise<RoomInvitationLink> {
		await this.roomInvitationLinkRepo.save(link);
		return link;
	}

	public async findLinkByRoomId(roomId: string): Promise<RoomInvitationLink[]> {
		const links = await this.roomInvitationLinkRepo.findByRoomId(roomId);
		return links;
	}

	public async deleteLinks(linkIds: string[]): Promise<void> {
		await this.roomInvitationLinkRepo.delete(linkIds);
	}

	public async findById(linkId: string): Promise<RoomInvitationLink> {
		const roomInvitationLink = await this.roomInvitationLinkRepo.findById(linkId);
		return roomInvitationLink;
	}

	public async findByIds(linkIds: string[]): Promise<RoomInvitationLink[]> {
		const roomInvitationLinks = await this.roomInvitationLinkRepo.findByIds(linkIds);
		return roomInvitationLinks;
	}
}
