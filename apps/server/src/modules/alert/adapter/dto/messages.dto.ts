import { Message } from '../../controller/dto';

export class MessagesDto {
	constructor(messages: [], success: boolean) {
		this.messages = messages;
		this.success = success;
	}

	messages: Message[];

	success: boolean;
}
