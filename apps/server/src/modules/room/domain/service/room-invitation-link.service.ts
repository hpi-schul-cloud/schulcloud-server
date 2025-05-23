import { Injectable } from '@nestjs/common';
import { RoomInvitationLinkRepo } from '../../repo';
import { RoomInvitationLink, RoomInvitationLinkDto } from '../do/room-invitation-link.do';
import { RoomInvitationLinkFactory } from '../factory/room-invitation-link.factory';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RoomDeletedEvent } from '../events/room-deleted.event';

@Injectable()
@EventsHandler(RoomDeletedEvent)
export class RoomInvitationLinkService implements IEventHandler<RoomDeletedEvent> {
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

	public async handle(event: RoomDeletedEvent): Promise<void> {
		const roomInvitationLinks = await this.roomInvitationLinkRepo.findByRoomId(event.id);
		await this.roomInvitationLinkRepo.delete(roomInvitationLinks.map((link) => link.id));
	}
}
