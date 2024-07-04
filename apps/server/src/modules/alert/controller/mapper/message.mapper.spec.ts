import { MessageMapper } from './message.mapper';
import { IncidentDto } from '../../adapter/dto';

describe('MessageMapper', () => {
	describe('map to message', () => {
		describe('when empty object', () => {
			it('should map to defaults', () => {
				const message = MessageMapper.mapToMessage({} as IncidentDto, '');

				expect(message.title).toBe('');
				expect(message.text).toBe('');
				expect(message.timestamp).toBe('1970-01-01 00:00:00');
				expect(message.origin.message_id).toBe(-1);
				expect(message.origin.page).toBe('status');
				expect(message.url).toBe('');
				expect(message.status).toBe('info');
			});
		});
	});

	describe('get status', () => {
		it('should return correct status from number', () => {
			const statuses = [1, 2, 4].map((nb) => MessageMapper.getStatus(nb));

			expect(statuses).toEqual(['info', 'danger', 'done']);
		});
	});
});
