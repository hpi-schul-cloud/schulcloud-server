import { ApiProperty } from '@nestjs/swagger';
import { MessageOrigin } from './message-origin';

export type MessageStatus = 'danger' | 'done' | 'info';

export class Message {
	constructor(
		title: string,
		text: string,
		timestamp: Date,
		origin: MessageOrigin,
		url: string,
		status: MessageStatus,
		createdAt: Date
	) {
		this.title = title;
		this.text = text;
		this.timestamp = timestamp;
		this.origin = origin;
		this.url = url;
		this.status = status;
		this.createdAt = createdAt;
	}

	@ApiProperty()
	title: string;

	@ApiProperty()
	text: string;

	@ApiProperty()
	timestamp: Date;

	@ApiProperty()
	origin: MessageOrigin;

	@ApiProperty()
	url: string;

	@ApiProperty()
	status: MessageStatus;

	@ApiProperty()
	createdAt: Date;
}
