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
	describe('should create Prometheus metrics app and run listen with configured port', () => {
		const testPort = 9000;

		let appMockListenFn: jest.Mock;

		beforeEach(() => {
			appMockListenFn = jest.fn();

			(createPrometheusMetricsApp as jest.Mock).mockClear();
			(createPrometheusMetricsApp as jest.Mock).mockReturnValue({ listen: appMockListenFn });
		});

		it('with all the other features enabled', () => {
			Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
			Configuration.set('PROMETHEUS_METRICS_PORT', testPort);
			Configuration.set('PROMETHEUS_METRICS_COLLECT_DEFAULT_METRICS', true);
			Configuration.set('PROMETHEUS_METRICS_COLLECT_METRICS_ROUTE_METRICS', true);
			PrometheusMetricsConfig.reload();

			createAndStartPrometheusMetricsAppIfEnabled(testLogger);

			expect(createPrometheusMetricsApp).toBeCalledTimes(1);
			expect(appMockListenFn).toHaveBeenLastCalledWith(testPort, expect.any(Function));

			// Also test logging info message about running Prometheus metrics app.
			const testLoggerSpy = jest.spyOn(testLogger, 'log');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
			appMockListenFn.mock.lastCall[1]();
			expect(testLoggerSpy).toBeCalledTimes(1);
			testLoggerSpy.mockClear();
		});

		it('even with all the other features disabled', () => {
			Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
			Configuration.set('PROMETHEUS_METRICS_PORT', testPort);
			Configuration.set('PROMETHEUS_METRICS_COLLECT_DEFAULT_METRICS', false);
			Configuration.set('PROMETHEUS_METRICS_COLLECT_METRICS_ROUTE_METRICS', false);
			PrometheusMetricsConfig.reload();

			createAndStartPrometheusMetricsAppIfEnabled(testLogger);

			expect(createPrometheusMetricsApp).toBeCalledTimes(1);
			expect(appMockListenFn).toHaveBeenLastCalledWith(testPort, expect.any(Function));

			const testLoggerSpy = jest.spyOn(testLogger, 'log');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
			appMockListenFn.mock.lastCall[1]();
			expect(testLoggerSpy).toBeCalledTimes(1);
			testLoggerSpy.mockClear();
		});
	});

	it('should not create Prometheus metrics app if the whole feature is not enabled', () => {
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', false);
		PrometheusMetricsConfig.reload();

		createAndStartPrometheusMetricsAppIfEnabled(testLogger);

		expect(createPrometheusMetricsApp).not.toBeCalled();
	});
});
