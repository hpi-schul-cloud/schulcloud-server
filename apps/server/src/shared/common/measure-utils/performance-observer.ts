import { PerformanceEntry, PerformanceObserver } from 'node:perf_hooks';
import util from 'util';
import { Loggable, LoggableMessage } from '../loggable';

interface InfoLogger {
	info(input: Loggable): void;
}

export class MeasuresLoggable implements Loggable {
	constructor(private readonly entries: PerformanceEntry[]) {}

	getLogMessage(): LoggableMessage {
		const stringifiedEntries = this.entries.map((entry) => {
			const detail = util.inspect(entry.detail).replace(/\n/g, '').replace(/\\n/g, '');
			return `{ location: ${entry.name}, duration: ${entry.duration}, detail: ${detail} }`;
		});
		const data = `[${stringifiedEntries.join(', ')}]`;
		const message = { message: `Measure results`, data };

		return message;
	}
}

export class InitialisePerformanceObserverLoggable implements Loggable {
	getLogMessage(): LoggableMessage {
		return {
			message: 'Initialise PerformanceObserver...',
		};
	}
}

let observer: PerformanceObserver | null = null;

export const initialisePerformanceObserver = (infoLogger: InfoLogger): void => {
	infoLogger.info(new InitialisePerformanceObserverLoggable());

	if (observer === null) {
		observer = new PerformanceObserver((perfObserverList) => {
			const entries = perfObserverList.getEntriesByType('measure');
			infoLogger.info(new MeasuresLoggable(entries));
		});

		observer.observe({ type: 'measure', buffered: true });
	}
};
