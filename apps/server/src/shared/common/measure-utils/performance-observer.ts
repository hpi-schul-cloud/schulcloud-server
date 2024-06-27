import { PerformanceEntry, PerformanceObserver } from 'node:perf_hooks';
import util from 'util';
import { Loggable, LoggableMessage } from '../loggable';

interface InfoLogger {
	info(input: Loggable): void;
}

class MeasureLoggable implements Loggable {
	constructor(private readonly entry: PerformanceEntry) {}

	getLogMessage(): LoggableMessage {
		const detail = util.inspect(this.entry.detail).replace(/\n/g, '').replace(/\\n/g, '');
		const data = `location: ${this.entry.name}, duration: ${this.entry.duration}, detail: ${detail}`;

		const message = {
			message: `Performance measure result`,
			data,
		};

		return message;
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
			entries.forEach((entry) => {
				infoLogger.info(new MeasureLoggable(entry));
			});
		});
		obs.observe({ type: 'measure', buffered: true });
	}

	return obs;
};
