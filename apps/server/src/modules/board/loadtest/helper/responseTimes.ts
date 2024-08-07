import { groupBy } from 'lodash';
import { ResponseTimeRecord } from '../types';

export const calculateTotalAvg = (responseTimes: ResponseTimeRecord[]) =>
	responseTimes.reduce((acc, curr) => acc + curr.responseTime, 0) / responseTimes.length;

export const calculateStats = (responseTimes: ResponseTimeRecord[]) => {
	const grouped = groupBy(responseTimes, 'action');
	const avgByAction = Object.entries(grouped).reduce((acc, [action, records]) => {
		const avg = records.reduce((all, cur) => all + cur.responseTime, 0) / records.length;
		return { ...acc, [action]: avg.toFixed(2).replace('.', ',') };
	}, {});

	return avgByAction;
};

export const getStats = (responseTimes: ResponseTimeRecord[]) => {
	const totalAvg = calculateTotalAvg(responseTimes).toFixed(2).replace('.', ',');
	const avgByAction = calculateStats(responseTimes);
	return { totalAvg, avgByAction };
};

export const getSummaryText = (responseTimes: ResponseTimeRecord[]) => {
	const { totalAvg, avgByAction } = getStats(responseTimes);

	const groupedAveragesText = Object.entries(avgByAction)
		.map(([action, avg]) => `<b>${action}</b>: ${avg as string} ms`)
		.join('<br>');
	const totalAverageText = `total avg: ${totalAvg} ms`;
	const summaryText = `${totalAverageText}<br />${groupedAveragesText}`;
	return summaryText;
};
