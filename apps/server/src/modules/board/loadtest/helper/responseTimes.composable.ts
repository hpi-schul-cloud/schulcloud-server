import { groupBy } from 'lodash';
import { ResponseTimeRecord } from '../types';

let responseTimes: ResponseTimeRecord[] = [];

export const useResponseTimes = () => {
	function formatTime(time: number) {
		return `${time.toFixed(2)}`;
	}

	function addResponseTime(responseTime: ResponseTimeRecord) {
		responseTimes.push(responseTime);
	}

	function getResponseTimes() {
		return responseTimes;
	}

	function getTotalAvg() {
		return formatTime(responseTimes.reduce((acc, curr) => acc + curr.responseTime, 0) / responseTimes.length);
	}

	function getAvgByAction() {
		const grouped = groupBy(responseTimes, 'action');
		const actions = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
		const avgByAction: Record<string, string> = {};
		for (const action of actions) {
			const records = grouped[action];
			const avg = records.reduce((all, cur) => all + cur.responseTime, 0) / records.length;
			avgByAction[action] = formatTime(avg);
		}

		return avgByAction;
	}

	function reset() {
		responseTimes = [];
	}

	return {
		addResponseTime,
		getResponseTimes,
		getAvgByAction,
		getTotalAvg,
		reset,
	};
};
