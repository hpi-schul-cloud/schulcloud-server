import { IncidentDto } from '../../adapter/dto';
import { Message, MessageOrigin, MessageStatus } from '../dto';

export class MessageMapper {
	static mapToMessage(incident: IncidentDto, url: string): Message {
		return new Message(
			incident.name || '',
			incident.message || '',
			incident.updated_at || '1970-01-01 00:00:00',
			new MessageOrigin(incident.id || -1, 'status'),
			url,
			this.getStatus(incident.status),
			incident.created_at
		);
	}

	static getStatus(number: number): MessageStatus {
		if (number === 2) {
			return 'danger';
		}

		if (number === 4) {
			return 'done';
		}

		return 'info';
	}
}
