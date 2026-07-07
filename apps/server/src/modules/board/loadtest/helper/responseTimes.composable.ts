import { groupBy } from 'lodash';
import { type ResponseTimeRecord } from '../types';

let responseTimes: ResponseTimeRecord[] = [];

export const useResponseTimes = (): {
	addResponseTime: (responseTime: ResponseTimeRecord) => void;
	getResponseTimes: () => ResponseTimeRecord[];
	getTotalAvg: () => string;
	getAvgByAction: () => Record<string, string>;
	reset: () => void;
} => {
	const formatTime = (time: number): string => `${time.toFixed(2)}`;

	const addResponseTime = (responseTime: ResponseTimeRecord): void => {
		responseTimes.push(responseTime);
	};

	const getResponseTimes = (): ResponseTimeRecord[] => responseTimes;

	const getTotalAvg = (): string =>
		formatTime(responseTimes.reduce((acc, curr) => acc + curr.responseTime, 0) / responseTimes.length);

	const getAvgByAction = (): Record<string, string> => {
		const grouped = groupBy(responseTimes, 'action');
		const actions = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
		const avgByAction: Record<string, string> = {};
		for (const action of actions) {
			const records = grouped[action];
			const avg = records.reduce((all, cur) => all + cur.responseTime, 0) / records.length;
			avgByAction[action] = formatTime(avg);
		}

		return avgByAction;
	};

	const reset = (): void => {
		responseTimes = [];
	};

	return {
		addResponseTime,
		getResponseTimes,
		getAvgByAction,
		getTotalAvg,
		reset,
	};
};
