import { useResponseTimes } from './responseTimes.composable';

describe('responseTimes.composable', () => {
	const setup = () => {
		const { addResponseTime, getResponseTimes, getTotalAvg, getAvgByAction, reset } = useResponseTimes();

		reset();

		return { addResponseTime, getResponseTimes, getTotalAvg, getAvgByAction };
	};

	describe('addResponseTime', () => {
		it('should store an added response time', () => {
			const { addResponseTime, getResponseTimes } = setup();

			addResponseTime({ action: 'action', responseTime: 100 });

			expect(getResponseTimes()).toEqual([{ action: 'action', responseTime: 100 }]);
		});

		it('should store all added response times', () => {
			const { addResponseTime, getResponseTimes } = setup();

			addResponseTime({ action: 'create-card', responseTime: 60 });
			addResponseTime({ action: 'create-element', responseTime: 70 });
			addResponseTime({ action: 'update-card-title', responseTime: 80 });
			addResponseTime({ action: 'update-element', responseTime: 90 });

			expect(getResponseTimes()).toHaveLength(4);
		});
	});

	describe('getTotalAvg', () => {
		it('should return the average response time of all added response times', () => {
			const { addResponseTime, getTotalAvg } = setup();

			addResponseTime({ action: 'create-card', responseTime: 60 });
			addResponseTime({ action: 'create-element', responseTime: 70 });
			addResponseTime({ action: 'update-card-title', responseTime: 80 });
			addResponseTime({ action: 'update-element', responseTime: 90 });

			expect(getTotalAvg()).toBe('75.00');
		});
	});

	describe('getAvgByAction', () => {
		it('should return the average response time of all added response times grouped by action', () => {
			const { addResponseTime, getAvgByAction } = setup();

			addResponseTime({ action: 'create-card', responseTime: 60 });
			addResponseTime({ action: 'create-card', responseTime: 70 });
			addResponseTime({ action: 'update-card-title', responseTime: 80 });
			addResponseTime({ action: 'update-card-title', responseTime: 90 });

			expect(getAvgByAction()).toEqual({ 'create-card': '65.00', 'update-card-title': '85.00' });
		});
	});
});
