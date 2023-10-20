import { createMock } from '@golevelup/ts-jest';

import express, { Request, Response, NextFunction, RequestHandler, Express } from 'express';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Logger } from '@src/core/logger';
import {
	PrometheusMetricsConfig,
	createAPIResponseTimeMetricMiddleware,
	createPrometheusMetricsApp,
} from '@shared/infra/metrics';
import {
	PrometheusMetricsSetupState,
	PrometheusMetricsSetupStateLoggable,
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
} from './prometheus-metrics';

jest.mock('@shared/infra/metrics', () => {
	const moduleMock: unknown = {
		...jest.requireActual('@shared/infra/metrics'),
		createAPIResponseTimeMetricMiddleware: jest.fn(),
		createPrometheusMetricsApp: jest.fn(),
	};

	return moduleMock;
});

const testLogger = createMock<Logger>();

let configBefore: IConfig;

beforeAll(() => {
	configBefore = Configuration.toObject({ plainSecrets: true });
});

beforeEach(() => {
	Configuration.reset(configBefore);

	const middlewareMock: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
		next();
	};

	(createAPIResponseTimeMetricMiddleware as jest.Mock).mockClear();
	(createAPIResponseTimeMetricMiddleware as jest.Mock).mockReturnValue(middlewareMock);

	const appMock = { listen: jest.fn() };

	(createPrometheusMetricsApp as jest.Mock).mockClear();
	(createPrometheusMetricsApp as jest.Mock).mockReturnValue(appMock);
});

afterAll(() => {
	Configuration.reset(configBefore);
});

describe('PrometheusMetricsSetupStateLoggable', () => {
	describe('getLogMessage', () => {
		describe('should return a log message with proper content', () => {
			const expectedMessage = 'Setting up Prometheus metrics...';

			it.each([
				[PrometheusMetricsSetupState.FEATURE_DISABLED_MIDDLEWARES_WILL_NOT_BE_CREATED],
				[PrometheusMetricsSetupState.API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED],
				[PrometheusMetricsSetupState.FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED],
				[PrometheusMetricsSetupState.COLLECTING_DEFAULT_METRICS_DISABLED],
				[PrometheusMetricsSetupState.COLLECTING_METRICS_ROUTE_METRICS_DISABLED],
			])("for the '%s' state", (state: PrometheusMetricsSetupState) => {
				const testLogMessage = new PrometheusMetricsSetupStateLoggable(state).getLogMessage();

				expect(testLogMessage).toHaveProperty('message', expectedMessage);
				expect(testLogMessage).toHaveProperty('data', { state });
			});
		});
	});
});

describe('addPrometheusMetricsMiddlewaresIfEnabled', () => {
	let testApp: Express;
	let testAppUseSpy: jest.SpyInstance;

	beforeEach(() => {
		testApp = express();
		testAppUseSpy = jest.spyOn(testApp, 'use');
	});

	it('should create the API response time metric middleware and should add it to the given app', () => {
		// To not create setters in the PrometheusMetricsConfig just for the unit tests
		// purpose, we will enable the Prometheus metrics feature the way it should be
		// enabled in a real app which is via the app configuration.
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
		PrometheusMetricsConfig.reload();

		addPrometheusMetricsMiddlewaresIfEnabled(testLogger, testApp);

		expect(createAPIResponseTimeMetricMiddleware).toBeCalled();
		expect(testAppUseSpy).toBeCalled();
	});

	it('should not create the API response time metric middleware and should not add it to the given app', () => {
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', false);
		PrometheusMetricsConfig.reload();

		addPrometheusMetricsMiddlewaresIfEnabled(testLogger, testApp);

		expect(createAPIResponseTimeMetricMiddleware).not.toBeCalled();
		expect(testAppUseSpy).not.toBeCalled();
	});
});

describe('createAndStartPrometheusMetricsAppIfEnabled', () => {
	describe('should create Prometheus metrics app and run it', () => {
		const testPort = 9000;
		const testLoggerSpy = jest.spyOn(testLogger, 'log');

		let appMockListenFn: jest.Mock;

		beforeEach(() => {
			testLoggerSpy.mockClear();
			appMockListenFn = jest.fn();

			(createPrometheusMetricsApp as jest.Mock).mockClear();
			(createPrometheusMetricsApp as jest.Mock).mockReturnValue({ listen: appMockListenFn });
		});

		it.each([
			[true, true],
			[false, false],
			[true, false],
			[false, true],
		])(
			"with collecting default metrics set to '%s' and collecting metrics route metrics set to '%s'",
			(collectDefaultMetrics: boolean, collectMetricsRouteMetrics: boolean) => {
				Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
				Configuration.set('PROMETHEUS_METRICS_PORT', testPort);
				Configuration.set('PROMETHEUS_METRICS_COLLECT_DEFAULT_METRICS', collectDefaultMetrics);
				Configuration.set('PROMETHEUS_METRICS_COLLECT_METRICS_ROUTE_METRICS', collectMetricsRouteMetrics);
				PrometheusMetricsConfig.reload();

				createAndStartPrometheusMetricsAppIfEnabled(testLogger);

				expect(createPrometheusMetricsApp).toBeCalledTimes(1);
				expect(appMockListenFn).toHaveBeenLastCalledWith(testPort, expect.any(Function));

				// Also test logging info message about running Prometheus metrics app.
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
				appMockListenFn.mock.lastCall[1]();
				expect(testLoggerSpy).toBeCalledTimes(1);
			}
		);
	});

	it('should not create Prometheus metrics app if the whole feature is not enabled', () => {
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', false);
		PrometheusMetricsConfig.reload();

		createAndStartPrometheusMetricsAppIfEnabled(testLogger);

		expect(createPrometheusMetricsApp).not.toBeCalled();
	});
});
