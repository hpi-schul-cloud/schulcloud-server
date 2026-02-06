import { Logger } from '@core/logger/logger';
import { LogMessage } from '@core/logger/types/logging.types';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MetricConfig, METRICS_CONFIG_TOKEN, MetricsModule, ResponseTimeMetricsInterceptor } from '@infra/metrics';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppStartLoggable } from './app-start-loggable';
import {
	createMetricsServer,
	PrometheusMetricsSetupState,
	PrometheusMetricsSetupStateLoggable,
} from './metrics.server';

// Mock the NestFactory
jest.mock('@nestjs/core', () => {
	return {
		NestFactory: {
			create: jest.fn(),
		},
	};
});

describe('PrometheusMetricsSetupStateLoggable', () => {
	describe('getLogMessage', () => {
		const expectedMessage = 'Setting up Prometheus metrics...';

		it('should return correct log message for FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED', () => {
			const state = PrometheusMetricsSetupState.FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED;
			const loggable = new PrometheusMetricsSetupStateLoggable(state);

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: expectedMessage,
				data: {
					state: PrometheusMetricsSetupState.FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED,
				},
			});
		});

		it('should return correct log message for API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED', () => {
			const state = PrometheusMetricsSetupState.API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED;
			const loggable = new PrometheusMetricsSetupStateLoggable(state);

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: expectedMessage,
				data: {
					state: PrometheusMetricsSetupState.API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED,
				},
			});
		});

		it('should return correct log message for COLLECTING_METRICS_ROUTE_METRICS_DISABLED', () => {
			const state = PrometheusMetricsSetupState.COLLECTING_METRICS_ROUTE_METRICS_DISABLED;
			const loggable = new PrometheusMetricsSetupStateLoggable(state);

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: expectedMessage,
				data: {
					state: PrometheusMetricsSetupState.COLLECTING_METRICS_ROUTE_METRICS_DISABLED,
				},
			});
		});
	});
});

describe('createMetricsServer', () => {
	let mockNestApp: DeepMocked<INestApplication>;
	let mockMetricsApp: DeepMocked<INestApplication>;
	let mockLogger: DeepMocked<Logger>;
	let mockMetricConfig: DeepMocked<MetricConfig>;

	const testAppName = 'TestApp';
	const testPort = 9090;

	beforeEach(() => {
		mockNestApp = createMock<INestApplication>();
		mockMetricsApp = createMock<INestApplication>();
		mockLogger = createMock<Logger>();
		mockMetricConfig = createMock<MetricConfig>();

		// Setup default mock behavior
		(NestFactory.create as jest.Mock).mockResolvedValue(mockMetricsApp);
		mockMetricsApp.resolve.mockImplementation((token: unknown) => {
			if (token === METRICS_CONFIG_TOKEN) {
				return Promise.resolve(mockMetricConfig);
			}
			if (token === Logger) {
				return Promise.resolve(mockLogger);
			}
			return Promise.resolve({});
		});
		mockMetricConfig.metricsPort = testPort;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('when metrics feature is disabled', () => {
		beforeEach(() => {
			mockMetricConfig.featureMetricsEnabled = false;
		});

		it('should create metrics app and return early without starting server', async () => {
			await createMetricsServer(mockNestApp, testAppName);

			expect(NestFactory.create).toHaveBeenCalledWith(MetricsModule);
			expect(mockMetricsApp.resolve).toHaveBeenCalledWith(METRICS_CONFIG_TOKEN);
			expect(mockMetricsApp.resolve).toHaveBeenCalledWith(Logger);
			expect(mockLogger.setContext).toHaveBeenCalledWith('METRICS');
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					getLogMessage: expect.any(Function),
				})
			);
			expect(mockNestApp.useGlobalInterceptors).not.toHaveBeenCalled();
			expect(mockMetricsApp.listen).not.toHaveBeenCalled();
		});

		it('should log correct state when feature is disabled', async () => {
			await createMetricsServer(mockNestApp, testAppName);

			const logCallArgs = mockLogger.info.mock.calls[0][0];
			const logMessage = logCallArgs.getLogMessage() as LogMessage;
			// @ts-expect-error - TypeScript doesn't know the exact type of the log message data
			expect(logMessage.data?.state).toBe(PrometheusMetricsSetupState.FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED);
		});
	});

	describe('when metrics feature is enabled', () => {
		const setup = () => {
			mockMetricConfig.featureMetricsEnabled = true;
			mockMetricsApp.listen.mockImplementation(
				(port: number | string, hostnameOrCallback?: string | (() => void), callback?: () => void): Promise<any> => {
					// Handle both overloads
					const actualCallback = typeof hostnameOrCallback === 'function' ? hostnameOrCallback : callback;

					if (actualCallback) {
						actualCallback();
					}

					return Promise.resolve({});
				}
			);
		};

		describe('and route metrics collection is enabled', () => {
			it('should setup global interceptor and start metrics server', async () => {
				setup();
				await createMetricsServer(mockNestApp, testAppName);

				expect(mockNestApp.useGlobalInterceptors).toHaveBeenCalledWith(expect.any(ResponseTimeMetricsInterceptor));
				expect(mockMetricsApp.listen).toHaveBeenCalledWith(testPort, expect.any(Function));
				expect(mockLogger.info).toHaveBeenCalledTimes(2);
			});

			it('should log correct states', async () => {
				setup();
				await createMetricsServer(mockNestApp, testAppName);

				const firstLogCall = mockLogger.info.mock.calls[0][0];
				const firstLogMessage = firstLogCall.getLogMessage() as LogMessage;
				// @ts-expect-error - TypeScript doesn't know the exact type of the log message data
				expect(firstLogMessage.data?.state).toBe(
					PrometheusMetricsSetupState.API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED
				);

				// Second log call should be from the server start callback
				const secondLogCall = mockLogger.info.mock.calls[1][0];
				expect(secondLogCall).toBeInstanceOf(AppStartLoggable);
			});

			it('should set logger context correctly', async () => {
				setup();
				await createMetricsServer(mockNestApp, testAppName);

				expect(mockLogger.setContext).toHaveBeenCalledWith('METRICS');
				// Called twice - once initially and once in the callback
				expect(mockLogger.setContext).toHaveBeenCalledTimes(2);
			});
		});

		describe('and route metrics collection is disabled', () => {
			it('should not setup global interceptor but still start metrics server', async () => {
				mockMetricConfig.collectMetricsRouteMetrics = false;

				await createMetricsServer(mockNestApp, testAppName);

				expect(mockNestApp.useGlobalInterceptors).not.toHaveBeenCalled();
				expect(mockMetricsApp.listen).toHaveBeenCalledWith(testPort, expect.any(Function));
				expect(mockLogger.info).toHaveBeenCalledTimes(1);
			});

			it('should log correct state when route metrics are disabled', async () => {
				mockMetricConfig.collectMetricsRouteMetrics = false;

				await createMetricsServer(mockNestApp, testAppName);

				const firstLogCall = mockLogger.info.mock.calls[0][0];
				const firstLogMessage = firstLogCall.getLogMessage() as LogMessage;
				// @ts-expect-error - TypeScript doesn't know the exact type of the log message data
				expect(firstLogMessage.data?.state).toBe(PrometheusMetricsSetupState.COLLECTING_METRICS_ROUTE_METRICS_DISABLED);
			});
		});

		it('should use correct port from config', async () => {
			const customPort = 9999;
			mockMetricConfig.metricsPort = customPort;

			await createMetricsServer(mockNestApp, testAppName);

			expect(mockMetricsApp.listen).toHaveBeenCalledWith(customPort, expect.any(Function));
		});

		it('should create AppStartLoggable with correct parameters in callback', async () => {
			setup();
			const customPort = 8080;
			mockMetricConfig.metricsPort = customPort;

			await createMetricsServer(mockNestApp, testAppName);

			// The second info call should be the AppStartLoggable
			const appStartLoggable = mockLogger.info.mock.calls[1][0] as AppStartLoggable;
			const logMessage = appStartLoggable.getLogMessage();

			expect(logMessage.data).toEqual({
				appName: testAppName,
				port: customPort,
			});
		});
	});

	describe('error handling', () => {
		it('should handle errors when NestFactory.create fails', async () => {
			const error = new Error('Failed to create app');
			(NestFactory.create as jest.Mock).mockRejectedValue(error);

			await expect(createMetricsServer(mockNestApp, testAppName)).rejects.toThrow('Failed to create app');
		});

		it('should handle errors when resolving dependencies fails', async () => {
			const error = new Error('Failed to resolve dependency');
			mockMetricsApp.resolve.mockRejectedValue(error);

			await expect(createMetricsServer(mockNestApp, testAppName)).rejects.toThrow('Failed to resolve dependency');
		});

		it('should handle errors when starting the server fails', async () => {
			mockMetricConfig.featureMetricsEnabled = true;
			const error = new Error('Failed to start server');
			mockMetricsApp.listen.mockRejectedValue(error);

			await expect(createMetricsServer(mockNestApp, testAppName)).rejects.toThrow('Failed to start server');
		});
	});
});
