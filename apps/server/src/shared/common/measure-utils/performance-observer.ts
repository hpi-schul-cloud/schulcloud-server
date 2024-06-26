import { PerformanceObserver, PerformanceEntry } from 'node:perf_hooks';
import { Loggable, LoggableMessage } from '../loggable';

interface InfoLogger {
	info(input: Loggable): void;
}

class MeasureLoggable implements Loggable {
	entries: PerformanceEntry[] = [];

	constructor(entries: PerformanceEntry[]) {
		this.entries = entries;
	}

	getLogMessage(): LoggableMessage {
		const formatedStrings = this.entries.map((entry) => {
			const mappedInfos = `${entry.name}, duration:${entry.duration} }`;

			return mappedInfos;
		});
		const data = `[${formatedStrings.join(', ')}]`;

		return {
			message: 'Measure result',
			data,
		};
	}
}

class InitalisePerformanceLoggable implements Loggable {
	getLogMessage(): LoggableMessage {
		return {
			message: 'Initialise PerformanceObserver...',
		};
	}
}

let obs: PerformanceObserver | null = null;

/**
 * Please note after adding the observer is avaible on the complet node process.
 * This can be add in constructor of a class, in best case with feature flag. To add it or not.
 * After it the messaure can be used with:
 * performance.mark to create pointer and performance.messure to generate a delta between marks
 *
 * 	performance.mark('compressDocumentTransactional - start');
 *  // code to messure
 *  performance.mark('compressDocumentTransactional - end');
 *
 *	performance.measure(
 *		`tldraw:YMongodb:compressDocumentTransactional::${docName}`,
 *		'compressDocumentTransactional - start',
 *		'compressDocumentTransactional - end'
 *	);
 */
export const initilisedPerformanceObserver = (infoLogger: InfoLogger): PerformanceObserver => {
	if (obs === null) {
		infoLogger.info(new InitalisePerformanceLoggable());
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		obs = new PerformanceObserver((perfObserverList, observer) => {
			const entries = perfObserverList.getEntriesByType('measure');
			const loggable = new MeasureLoggable(entries);
			infoLogger.info(loggable);
		});
		obs.observe({ type: 'measure', buffered: true });
	}

	return obs;
};

export const formatMessureLog = (object: Record<string, unknown>): string => {
	const jsonString = Object.entries(object).map((array) => array.join(': '));

	return `{ ${jsonString.join(', ')}  `;
};
