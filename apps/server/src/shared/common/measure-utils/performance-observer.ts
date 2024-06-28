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
		const message = { message: `Measure result`, data };

		return message;
	}
}

class InitialisePerformanceObserverLoggable implements Loggable {
	getLogMessage(): LoggableMessage {
		return {
			message: 'Initialise PerformanceObserver...',
		};
	}
}

export const initialisePerformanceObserver = (infoLogger: InfoLogger): void => {
	infoLogger.info(new InitialisePerformanceObserverLoggable());

	const obs = new PerformanceObserver((perfObserverList) => {
		const entries = perfObserverList.getEntriesByType('measure');
		entries.forEach((entry) => {
			infoLogger.info(new MeasureLoggable(entry));
		});
	});

	obs.observe({ type: 'measure', buffered: true });
};
