import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Mail, MailService, PlainTextMailContent } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { RoomRepo } from '../../repo';
import { Room, RoomCreateProps, RoomProps, RoomUpdateProps } from '../do';
import { RoomDeletedEvent } from '../events/room-deleted.event';
import { RoomFeatures } from '../type';

@Injectable()
export class RoomService {
	constructor(
		private readonly roomRepo: RoomRepo,
		private readonly eventBus: EventBus,
		private readonly mailService: MailService
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
		const senderAddress = Configuration.get('SMTP_SENDER') as string;
		const completeMail: Mail = {
			mail: mailContent,
			recipients: [email],
			from: senderAddress,
		};
		return completeMail;
	}

	private generateRoomLink(roomId: string): string {
		const hostUrl = Configuration.get('HOST') as string;
		const baseRoomUrl = `${hostUrl}/rooms/`;
		const roomLink = baseRoomUrl + roomId;

		return roomLink;
	}

	private generateRoomWelcomeMailContent(roomName: string, roomLink: string): PlainTextMailContent {
		const mailContent = {
			subject: 'Raumbeitritt-Benachrichtigung',
			plainTextContent: `Benachrichtigung über Beitritt zum Raum ${roomName}, bitte nutze folgenden Link um darauf zuzugreifen: ${roomLink}`,
			htmlContent: `<p>Benachrichtigung über Beitritt zum Raum ${roomName}</p><p>Bitte nutze folgenden Link um darauf zuzugreifen: <a href="${roomLink}">${roomLink}</a></p>`,
		};
		return mailContent;
	}

	private async getRoomName(roomId: string): Promise<string> {
		const room = await this.roomRepo.findById(roomId);
		const roomName = room.getRoomName();
		return roomName;
	}
}
