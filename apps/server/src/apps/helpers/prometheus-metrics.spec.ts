import { createMock } from '@golevelup/ts-jest';

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Logger } from '@src/core/logger';
import { PrometheusMetricsConfig, createAPIResponseTimeMetricMiddleware } from '@shared/infra/metrics';
import { addPrometheusMetricsMiddlewaresIfEnabled } from './prometheus-metrics';

jest.mock('@shared/infra/metrics', () => {
	const mockedMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
		next();
	};

	const mockedModule: unknown = {
		...jest.requireActual('@shared/infra/metrics'),
		createAPIResponseTimeMetricMiddleware: jest.fn().mockReturnValue(mockedMiddleware),
	};

	return mockedModule;
});

describe('addPrometheusMetricsMiddlewaresIfEnabled', () => {
	const testLogger = createMock<Logger>();

	let configBefore: IConfig;

	beforeAll(() => {
		configBefore = Configuration.toObject({ plainSecrets: true });
	});

	beforeEach(() => {
		Configuration.reset(configBefore);
	});

	afterAll(() => {
		Configuration.reset(configBefore);
	});

	it('should not create the API response time metric middleware and should not add it to the given app', () => {
		// To not create setters in the PrometheusMetricsConfig just for the unit tests
		// purpose, we will disable the Prometheus metrics feature the way it should be
		// disabled in a real app which is via the app configuration.
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', false);
		PrometheusMetricsConfig.reload();

		const testApp = express();

		const appUseSpy = jest.spyOn(testApp, 'use');

		addPrometheusMetricsMiddlewaresIfEnabled(testLogger, testApp);

		expect(createAPIResponseTimeMetricMiddleware).not.toBeCalled();
		expect(appUseSpy).not.toBeCalled();
	});

	it('should create the API response time metric middleware and should add it to the given app', () => {
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
		PrometheusMetricsConfig.reload();

		const testApp = express();

		const appUseSpy = jest.spyOn(testApp, 'use');

		addPrometheusMetricsMiddlewaresIfEnabled(testLogger, testApp);

		expect(createAPIResponseTimeMetricMiddleware).toBeCalled();
		expect(appUseSpy).toBeCalled();
	});
});
