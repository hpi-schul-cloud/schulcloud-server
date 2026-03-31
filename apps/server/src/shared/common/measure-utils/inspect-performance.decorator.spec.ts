import {
	AggregatedStats,
	InspectPerformance,
	PerformanceLogMessage,
	configureInspectPerformance,
	formatAggregatedStats,
	getInspectPerformanceConfig,
	setPerformanceLogger,
} from './inspect-performance.decorator';

describe('InspectPerformance', () => {
	const originalConfig = getInspectPerformanceConfig();

	beforeEach(() => {
		configureInspectPerformance({
			enabled: true,
			exportPath: '',
			logThresholdMs: 0,
		});
	});

	afterEach(() => {
		configureInspectPerformance(originalConfig);
		setPerformanceLogger(null as unknown as (message: PerformanceLogMessage) => void);
		jest.restoreAllMocks();
	});

	describe('configureInspectPerformance', () => {
		it('should update configuration partially', () => {
			configureInspectPerformance({ enabled: false });

			const config = getInspectPerformanceConfig();

			expect(config.enabled).toBe(false);
			expect(config.exportPath).toBe('');
		});

		it('should update multiple config values', () => {
			configureInspectPerformance({
				enabled: false,
				exportPath: '/custom/path',
				logThresholdMs: 100,
			});

			const config = getInspectPerformanceConfig();

			expect(config.enabled).toBe(false);
			expect(config.exportPath).toBe('/custom/path');
			expect(config.logThresholdMs).toBe(100);
		});
	});

	describe('getInspectPerformanceConfig', () => {
		it('should return a copy of the configuration', () => {
			const config1 = getInspectPerformanceConfig();
			const config2 = getInspectPerformanceConfig();

			expect(config1).not.toBe(config2);
			expect(config1).toEqual(config2);
		});
	});

	describe('decorator on sync methods', () => {
		it('should track execution of sync method', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public syncMethod(): string {
					return 'result';
				}
			}

			const service = new TestService();
			const result = service.syncMethod();

			expect(result).toBe('result');
			expect(logMessages).toHaveLength(1);
			expect(logMessages[0].treeOutput).toContain('TestService.syncMethod');
		});

		it('should pass through return value', () => {
			configureInspectPerformance({ enabled: true });

			class TestService {
				@InspectPerformance()
				public compute(a: number, b: number): number {
					return a + b;
				}
			}

			const service = new TestService();
			const result = service.compute(2, 3);

			expect(result).toBe(5);
		});

		it('should propagate errors from sync methods', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public throwingMethod(): void {
					throw new Error('Test error');
				}
			}

			const service = new TestService();

			expect(() => service.throwingMethod()).toThrow('Test error');
			expect(logMessages).toHaveLength(1);
		});
	});

	describe('decorator on async methods', () => {
		it('should track execution of async method', async () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public async asyncMethod(): Promise<string> {
					return await Promise.resolve('async result');
				}
			}

			const service = new TestService();
			const result = await service.asyncMethod();

			expect(result).toBe('async result');
			expect(logMessages).toHaveLength(1);
			expect(logMessages[0].treeOutput).toContain('TestService.asyncMethod');
		});

		it('should propagate errors from async methods', async () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public async failingMethod(): Promise<void> {
					await Promise.resolve();
					throw new Error('Async error');
				}
			}

			const service = new TestService();

			await expect(service.failingMethod()).rejects.toThrow('Async error');
			expect(logMessages).toHaveLength(1);
		});
	});

	describe('nested calls', () => {
		it('should track nested method calls with correct depth', async () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class InnerService {
				@InspectPerformance()
				public async innerMethod(): Promise<string> {
					return await Promise.resolve('inner');
				}
			}

			class OuterService {
				constructor(private readonly inner: InnerService) {}

				@InspectPerformance()
				public async outerMethod(): Promise<string> {
					const result = await this.inner.innerMethod();
					return `outer-${result}`;
				}
			}

			const innerService = new InnerService();
			const outerService = new OuterService(innerService);
			const result = await outerService.outerMethod();

			expect(result).toBe('outer-inner');
			expect(logMessages).toHaveLength(1);
			expect(logMessages[0].treeOutput).toContain('OuterService.outerMethod');
			expect(logMessages[0].treeOutput).toContain('InnerService.innerMethod');
		});

		it('should calculate self duration correctly', async () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class ChildService {
				@InspectPerformance()
				public async childMethod(): Promise<void> {
					await new Promise((resolve) => setTimeout(resolve, 10));
				}
			}

			class ParentService {
				constructor(private readonly child: ChildService) {}

				@InspectPerformance()
				public async parentMethod(): Promise<void> {
					await this.child.childMethod();
				}
			}

			const childService = new ChildService();
			const parentService = new ParentService(childService);
			await parentService.parentMethod();

			expect(logMessages).toHaveLength(1);
			// Parent should show self time (very small) and total time
			const output = logMessages[0].treeOutput;
			expect(output).toContain('ParentService.parentMethod');
			expect(output).toContain('ChildService.childMethod');
		});
	});

	describe('custom labels', () => {
		it('should use custom label when provided', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance('CustomLabel')
				public method(): void {
					// empty
				}
			}

			const service = new TestService();
			service.method();

			expect(logMessages[0].treeOutput).toContain('CustomLabel');
			expect(logMessages[0].treeOutput).not.toContain('TestService.method');
		});
	});

	describe('disabled state', () => {
		it('should not track when disabled', () => {
			configureInspectPerformance({ enabled: false });
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public method(): string {
					return 'result';
				}
			}

			const service = new TestService();
			const result = service.method();

			expect(result).toBe('result');
			expect(logMessages).toHaveLength(0);
		});
	});

	describe('log threshold', () => {
		it('should not log when duration is below threshold', () => {
			configureInspectPerformance({ logThresholdMs: 10000 });
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public quickMethod(): string {
					return 'fast';
				}
			}

			const service = new TestService();
			service.quickMethod();

			expect(logMessages).toHaveLength(0);
		});

		it('should log when duration exceeds threshold', async () => {
			configureInspectPerformance({ logThresholdMs: 5 });
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public async slowMethod(): Promise<string> {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return 'slow';
				}
			}

			const service = new TestService();
			await service.slowMethod();

			expect(logMessages).toHaveLength(1);
		});
	});

	describe('formatAggregatedStats', () => {
		it('should return empty string for empty aggregated stats', () => {
			const result = formatAggregatedStats({});

			expect(result).toBe('');
		});

		it('should format single call without extra stats', () => {
			const aggregated: Record<string, AggregatedStats> = {
				TestMethod: {
					calls: 1,
					totalMs: 10.5,
					avgMs: 10.5,
					minMs: 10.5,
					maxMs: 10.5,
				},
			};

			const result = formatAggregatedStats(aggregated);

			expect(result).toContain('TestMethod: 10.50ms');
			expect(result).not.toContain('calls:');
		});

		it('should format multiple calls with full stats', () => {
			const aggregated: Record<string, AggregatedStats> = {
				TestMethod: {
					calls: 5,
					totalMs: 50,
					avgMs: 10,
					minMs: 5,
					maxMs: 20,
				},
			};

			const result = formatAggregatedStats(aggregated);

			expect(result).toContain('TestMethod: 50.00ms');
			expect(result).toContain('calls: 5');
			expect(result).toContain('avg: 10.00ms');
			expect(result).toContain('min: 5.00ms');
			expect(result).toContain('max: 20.00ms');
		});

		it('should include total line', () => {
			const aggregated: Record<string, AggregatedStats> = {
				MethodA: { calls: 2, totalMs: 20, avgMs: 10, minMs: 5, maxMs: 15 },
				MethodB: { calls: 3, totalMs: 30, avgMs: 10, minMs: 8, maxMs: 12 },
			};

			const result = formatAggregatedStats(aggregated);

			expect(result).toContain('Total execution time: 50.00ms (5 calls)');
		});
	});

	describe('concurrent async calls', () => {
		it('should track parallel async calls independently', async () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public async parallelMethod(id: number): Promise<number> {
					await new Promise((resolve) => setTimeout(resolve, 5));
					return id;
				}

				@InspectPerformance()
				public async orchestrator(): Promise<number[]> {
					const results = await Promise.all([this.parallelMethod(1), this.parallelMethod(2), this.parallelMethod(3)]);
					return results;
				}
			}

			const service = new TestService();
			const results = await service.orchestrator();

			expect(results).toEqual([1, 2, 3]);
			expect(logMessages).toHaveLength(1);
			expect(logMessages[0].aggregated).toContain('TestService.parallelMethod');
			expect(logMessages[0].aggregated).toContain('calls: 3');
		});
	});

	describe('console.info fallback', () => {
		it('should use console.info when no logger is set', () => {
			// eslint-disable-next-line no-console
			const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

			class TestService {
				@InspectPerformance()
				public method(): void {
					// empty
				}
			}

			const service = new TestService();
			service.method();

			expect(consoleInfoSpy).toHaveBeenCalled();
			const output = consoleInfoSpy.mock.calls[0][0] as string;
			expect(output).toContain('[Performance]');
			expect(output).toContain('TestService.method');
		});
	});
});
