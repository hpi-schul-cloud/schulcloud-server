import moment from 'moment';
import { formatDate } from './formatDate';

describe('formatDate', () => {
	it('should format a standard date correctly', () => {
		const date = moment('2023-10-05T14:48:00.000Z').zone('Europe/Berlin').toDate();
		const formattedDate = formatDate(date);
		expect(formattedDate).toBe('2023-10-05 16:48:00');
	});

	it('should format a date with a different time correctly', () => {
		const date = moment('2023-10-05T08:30:00.000Z').zone('Europe/Berlin').toDate();
		const formattedDate = formatDate(date);
		expect(formattedDate).toBe('2023-10-05 10:30:00');
	});

	it('should handle midnight correctly', () => {
		const date = moment('2023-10-05T00:00:00.000Z').zone('Europe/Berlin').toDate();
		const formattedDate = formatDate(date);
		expect(formattedDate).toBe('2023-10-05 02:00:00');
	});

	it('should format a date with different locale correctly', () => {
		const date = moment('2023-10-05T14:48:00.000Z').zone('Europe/Berlin').toDate();
		const formattedDate = formatDate(date);
		expect(formattedDate).toBe('2023-10-05 16:48:00');
	});
});
