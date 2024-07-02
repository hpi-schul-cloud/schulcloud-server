import { PerformanceEntry } from 'node:perf_hooks';
import {
	InitialisePerformanceObserverLoggable,
	MeasuresLoggable,
	initialisePerformanceObserver,
	closePerformanceObserver,
} from './performance-observer';

async function wait(timeoutMS: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, timeoutMS);
	});
}

async function waitForEventLoopEnd(): Promise<unknown> {
	return new Promise((resolve) => {
		process.nextTick(() => {
			resolve(undefined);
		});
	});
}

describe('PerformanceObserver', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('InitialisePerformanceObserverLoggable', () => {
		describe('getLogMessage', () => {
			it('should be log correct formated message', () => {
				const loggable = new InitialisePerformanceObserverLoggable();

				const log = loggable.getLogMessage();

				expect(log).toEqual({
					message: 'Initialise PerformanceObserver...',
				});
			});
		});
	});

	describe('MeasuresLoggable', () => {
		describe('getLogMessage', () => {
			const setup = () => {
				const performanceEntry = { name: 'a', duration: 1, detail: { x: 1 } } as PerformanceEntry;

				const loggable = new MeasuresLoggable([performanceEntry, performanceEntry]);

				return { loggable };
			};

			it('should be log correct formated message', () => {
				const { loggable } = setup();

				const log = loggable.getLogMessage();

				expect(log).toEqual({
					message: 'Measure results',
					data: '[{ location: a, duration: 1, detail: { x: 1 } }, { location: a, duration: 1, detail: { x: 1 } }]',
				});
			});
		});
	});

	describe('initialisePerformanceObserver', () => {
		const setup = () => {
			const mockInfoLogger = {
				info: () => {},
			};
			const infoLoggerSpy = jest.spyOn(mockInfoLogger, 'info');

			return { infoLoggerSpy, mockInfoLogger };
		};

		it('should be log by execution', () => {
			const { infoLoggerSpy, mockInfoLogger } = setup();

			initialisePerformanceObserver(mockInfoLogger);

			expect(infoLoggerSpy).toHaveBeenNthCalledWith(1, new InitialisePerformanceObserverLoggable());

			closePerformanceObserver();
		});

		it('should be log messure if it is executed', async () => {
			const { infoLoggerSpy, mockInfoLogger } = setup();
			initialisePerformanceObserver(mockInfoLogger);
			infoLoggerSpy.mockClear();

			performance.mark('startMark');
			await wait(1);
			performance.measure('myMeasure', {
				start: 'startMark',
				detail: { x: 1 },
			});

			await waitForEventLoopEnd();
			expect(infoLoggerSpy).toHaveBeenNthCalledWith(1, new MeasuresLoggable([]));

			closePerformanceObserver();
		});
	});
});
