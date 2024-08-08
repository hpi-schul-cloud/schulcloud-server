import { calculateTotalAvg, calculateStats, getStats, getSummaryText } from './responseTimes';
import { ResponseTimeRecord } from '../types';

describe('Response Times', () => {
	const responseTimes: ResponseTimeRecord[] = [
		{ action: 'someAction', responseTime: 100 },
		{ action: 'someAction', responseTime: 200 },
		{ action: 'someAction', responseTime: 300 },
		{ action: 'someAction', responseTime: 400 },
		{ action: 'someAction', responseTime: 500 },
		{ action: 'otherAction', responseTime: 600 },
	];

	describe('calculateTotalAvg', () => {
		it('should calculate the average response time', () => {
			const avg = calculateTotalAvg(responseTimes);
			expect(avg).toBe(350); // (100 + 200 + 300 + 400 + 500 + 600) / 6 = 300
		});
	});

	describe('calculateStats', () => {
		it('should calculate the minimum, maximum, and average response time', () => {
			const stats = calculateStats(responseTimes) as { someAction: number; otherAction: number };

			expect(stats.someAction).toBe('300,00');
			expect(stats.otherAction).toBe('600,00');
		});
	});

	describe('getStats', () => {
		it('should return the statistics summary of response times', () => {
			const stats = getStats(responseTimes);
			expect(stats).toEqual({
				avgByAction: {
					otherAction: '600,00',
					someAction: '300,00',
				},
				totalAvg: '350,00',
			});
		});
	});

	describe('getSummaryText', () => {
		it('should return a summary text of response times', () => {
			const summaryText = getSummaryText(responseTimes);

			expect(summaryText).toBe(
				'total avg: 350,00 ms<br /><b>someAction</b>: 300,00 ms<br><b>otherAction</b>: 600,00 ms'
			);
		});
	});
});
