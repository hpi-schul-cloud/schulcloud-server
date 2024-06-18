import { PerformanceObserver, PerformanceEntry } from 'node:perf_hooks';
import { Loggable, LoggableMessage } from '../loggable';

interface InfoLogger {
	alert(input: Loggable): void;
	info(input: Loggable): void;
}

class MeasureLoggable implements Loggable {
	entries: PerformanceEntry[] = [];

	constructor(entries: PerformanceEntry[]) {
		this.entries = entries;
	}

	getLogMessage(): LoggableMessage {
		const data = JSON.stringify(this.entries);

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
		infoLogger.alert(new InitalisePerformanceLoggable());
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		obs = new PerformanceObserver((perfObserverList, observer) => {
			const entries = perfObserverList.getEntries();
			const loggable = new MeasureLoggable(entries);
			infoLogger.alert(loggable);
		});
		obs.observe({ type: 'measure', buffered: true });
	}

	return obs;
};
