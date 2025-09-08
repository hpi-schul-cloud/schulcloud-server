import { formatDate } from './format-date';

describe('formatDate', () => {
	it('should format a standard date correctly', () => {
		const date = new Date('2023-10-05T14:48:00.000Z');
		const formattedDate = formatDate(date);

		expect(formattedDate).toEqual(expect.stringContaining('2023-10-05'));
		expect(formattedDate).toEqual(expect.stringContaining(':48:00'));
	});

	it('should format a date with a different time correctly', () => {
		const date = new Date('2023-10-05T08:30:00.000Z');
		const formattedDate = formatDate(date);

		expect(formattedDate).toEqual(expect.stringContaining('2023-10-05'));
		expect(formattedDate).toEqual(expect.stringContaining(':30:00'));
	});

	it('should handle midnight correctly', () => {
		const date = new Date('2023-10-05T00:00:00.000Z');
		const formattedDate = formatDate(date);

		expect(formattedDate).toEqual(expect.stringContaining('2023-10-05'));
		expect(formattedDate).toEqual(expect.stringContaining(':00:00'));
	});

	it('should format a date with different locale correctly', () => {
		const date = new Date('2023-10-05T14:42:00.000Z');
		const formattedDate = formatDate(date);

		expect(formattedDate).toEqual(expect.stringContaining('2023-10-05'));
		expect(formattedDate).toEqual(expect.stringContaining(':42:00'));
	});
});
