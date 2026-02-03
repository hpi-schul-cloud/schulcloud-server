import { Mail, MailService, PlainTextMailContent } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { RoomRepo } from '../../repo';
import { ROOM_CONFIG_TOKEN, RoomConfig } from '../../room.config';
import { Room, RoomCreateProps, RoomProps, RoomUpdateProps } from '../do';
import { RoomDeletedEvent } from '../events/room-deleted.event';
import { RoomFeatures } from '../type';

@Injectable()
export class RoomService {
	constructor(
		private readonly roomRepo: RoomRepo,
		private readonly eventBus: EventBus,
		private readonly mailService: MailService,
		@Inject(ROOM_CONFIG_TOKEN) private readonly config: RoomConfig
	) {}

	public async getRoomsByIds(roomIds: EntityId[]): Promise<Room[]> {
		const rooms = await this.roomRepo.findByIds(roomIds);

		return rooms;
	}

	public async createRoom(props: RoomCreateProps): Promise<Room> {
		const roomProps: RoomProps = {
			id: new ObjectId().toHexString(),
			name: props.name,
			color: props.color,
			schoolId: props.schoolId,
			features: props.features,
			// make sure that the dates are not null at runtime
			startDate: props.startDate ?? undefined,
			endDate: props.endDate ?? undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.validateTimeSpan(props, roomProps.id);
		const room = new Room(roomProps);

		await this.roomRepo.save(room);

		return room;
	}

	public async getSingleRoom(roomId: EntityId): Promise<Room> {
		const room = await this.roomRepo.findById(roomId);

		return room;
	}

	public async roomExists(roomId: EntityId): Promise<boolean> {
		let room: Room;
		try {
			room = await this.getSingleRoom(roomId);
		} catch (error) {
			return false;
		}

		return !!room;
	}

	public async updateRoom(room: Room, props: RoomUpdateProps): Promise<void> {
		this.validateTimeSpan(props, room.id);

		room.name = props.name;
		room.color = props.color;
		room.features = props.features;
		// make sure that the dates are not null at runtime
		room.startDate = props.startDate ?? undefined;
		room.endDate = props.endDate ?? undefined;

		await this.roomRepo.save(room);
	}

	public async deleteRoom(room: Room): Promise<void> {
		await this.roomRepo.delete(room);

		await this.eventBus.publish(new RoomDeletedEvent(room.id));
	}

	public canEditorManageVideoconferences(room: Room): boolean {
		return room.features.includes(RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE);
	}

	public async sendRoomWelcomeMail(email: string, roomId: string): Promise<void> {
		const roomWelcomeMail = await this.generateRoomWelcomeMail(email, roomId);
		await this.mailService.send(roomWelcomeMail);
	}

	private validateTimeSpan(props: RoomCreateProps | RoomUpdateProps, roomId: string): void {
		if (props.startDate != null && props.endDate != null && props.startDate > props.endDate) {
			throw new ValidationError(
				`Invalid room timespan. Start date '${props.startDate.toISOString()}' has to be before end date: '${props.endDate.toISOString()}'. Room id='${roomId}'`
			);
		}
	}

	private async generateRoomWelcomeMail(email: string, roomId: string): Promise<Mail> {
		const roomLink = this.generateRoomLink(roomId);
		const roomName = await this.getRoomName(roomId);
		const mailContent = this.generateRoomWelcomeMailContent(roomName, roomLink);
		const completeMail: Mail = {
			mail: mailContent,
			recipients: [email],
			from: this.config.fromEmailAddress,
		};
		return completeMail;
	}

	private generateRoomLink(roomId: string): string {
		const { hostUrl } = this.config;
		const baseRoomUrl = `${hostUrl}/rooms/`;
		const roomLink = baseRoomUrl + roomId;

		return roomLink;
	}

	private generateRoomWelcomeMailContent(roomName: string, roomLink: string): PlainTextMailContent {
		const { productName } = this.config;
		const stripTags = (html: string): string =>
			html
				.replace(/<(\/p>|<br\s*\/)>/gim, '\n')
				.replace(/<hr\s*\/?>/gim, '\n\n------------\n\n')
				.replace(/<\/?[^>]+(>|$)/g, '');

		const germanTitle = `Benachrichtigung über Zugang zum Raum ${roomName}`;
		const englishTitle = `Notification of access to room ${roomName}`;

		const germanHtml = `<p>Der Zugriff auf den Raum ${roomName} wurde soeben freigeschaltet. Über den folgenden Link kann der Raum direkt aufgerufen werden:</p>
				<p><a href="${roomLink}">${roomLink}</a></p>
				<p>Mit freundlichen Grüßen<br />
				${productName}-Team</p>`;
		const englishHtml = `<p>Access to room ${roomName} has just been activated. The room can be accessed directly via the following link:</p>
				<p><a href="${roomLink}">${roomLink}</a></p>
				<p>Best regards,<br />
				${productName}-Team</p>`;
		const htmlContent = `<html><body><div lang="de"><h1>${germanTitle}</h1>${germanHtml}</div>
				<hr />
				<div lang="en"><h1>${englishTitle}</h1>${englishHtml}</div></body></html>`;

		const mailContent = {
			subject: `${productName}: ${germanTitle}`,
			plainTextContent: stripTags(htmlContent),
			htmlContent: '',
		};

		return mailContent;
	}

	private async getRoomName(roomId: string): Promise<string> {
		const room = await this.roomRepo.findById(roomId);
		const roomName = room.getRoomName();
		return roomName;
	}
}
