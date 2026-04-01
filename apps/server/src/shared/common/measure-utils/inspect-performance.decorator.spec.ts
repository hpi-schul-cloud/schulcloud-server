import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	AggregatedStats,
	InspectPerformance,
	Measurement,
	PerformanceLogMessage,
	PerformanceReport,
	configureInspectPerformance,
	formatAggregatedStats,
	getInspectPerformanceConfig,
	logSummary,
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

	describe('logSummary', () => {
		it('should log measurements correctly', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			const measurements: Measurement[] = [
				{ path: 'RootMethod', depth: 0, duration: 100, label: 'RootMethod' },
				{ path: 'RootMethod -> ChildMethod', depth: 1, duration: 50, label: 'ChildMethod' },
			];

			logSummary(measurements);

			expect(logMessages).toHaveLength(1);
			expect(logMessages[0].treeOutput).toContain('RootMethod');
			expect(logMessages[0].treeOutput).toContain('ChildMethod');
			expect(logMessages[0].aggregated).toContain('RootMethod');
		});

		describe('when measurements array is empty', () => {
			it('should not log', () => {
				const logMessages: PerformanceLogMessage[] = [];
				setPerformanceLogger((msg) => logMessages.push(msg));

				logSummary([]);

				expect(logMessages).toHaveLength(0);
			});
		});

		describe('when duration is below threshold', () => {
			it('should not log', () => {
				configureInspectPerformance({ logThresholdMs: 1000 });
				const logMessages: PerformanceLogMessage[] = [];
				setPerformanceLogger((msg) => logMessages.push(msg));

				const measurements: Measurement[] = [{ path: 'TestMethod', depth: 0, duration: 10, label: 'TestMethod' }];

				logSummary(measurements);

				expect(logMessages).toHaveLength(0);
			});
		});
	});

	describe('JSON export', () => {
		const testExportDir = path.join(process.cwd(), '.test-track-time');

		afterEach(() => {
			// Clean up test export directory
			if (fs.existsSync(testExportDir)) {
				fs.rmSync(testExportDir, { recursive: true, force: true });
			}
		});

		describe('when exportPath is empty', () => {
			it('should not export', () => {
				configureInspectPerformance({ exportPath: '' });
				const logMessages: PerformanceLogMessage[] = [];
				setPerformanceLogger((msg) => logMessages.push(msg));

				const measurements: Measurement[] = [{ path: 'TestMethod', depth: 0, duration: 100, label: 'TestMethod' }];

				// Should not throw and should not create any directory
				expect(() => logSummary(measurements, true)).not.toThrow();
				// Verify test export dir was not created
				expect(fs.existsSync(testExportDir)).toBe(false);
			});
		});

		describe('when writeJson is true and exportPath is set', () => {
			it('should export JSON file', () => {
				configureInspectPerformance({ exportPath: '.test-track-time' });
				const logMessages: PerformanceLogMessage[] = [];
				setPerformanceLogger((msg) => logMessages.push(msg));

				const measurements: Measurement[] = [{ path: 'TestMethod', depth: 0, duration: 100, label: 'TestMethod' }];

				logSummary(measurements, true);

				expect(fs.existsSync(testExportDir)).toBe(true);

				const files = fs.readdirSync(testExportDir);
				expect(files).toHaveLength(1);
				expect(files[0]).toContain('TestMethod');
				expect(files[0].endsWith('.json')).toBe(true);

				const content = JSON.parse(fs.readFileSync(path.join(testExportDir, files[0]), 'utf-8')) as PerformanceReport;
				expect(content.rootLabel).toBe('TestMethod');
				expect(content.totalDurationMs).toBe(100);
				expect(content.measurements).toHaveLength(1);
			});
		});

		describe('when export deirectory does not exist', () => {
			it('should create export directory', () => {
				configureInspectPerformance({ exportPath: '.test-track-time/nested/dir' });
				const nestedDir = path.join(process.cwd(), '.test-track-time/nested/dir');

				const measurements: Measurement[] = [{ path: 'TestMethod', depth: 0, duration: 100, label: 'TestMethod' }];

				logSummary(measurements, true);

				expect(fs.existsSync(nestedDir)).toBe(true);
			});
		});

		it('should sanitize label in filename', () => {
			configureInspectPerformance({ exportPath: '.test-track-time' });

			const measurements: Measurement[] = [
				{ path: 'Test/Special:Method', depth: 0, duration: 100, label: 'Test/Special:Method' },
			];

			logSummary(measurements, true);

			const files = fs.readdirSync(testExportDir);
			expect(files[0]).toContain('Test_Special_Method');
			expect(files[0]).not.toContain('/');
			expect(files[0]).not.toContain(':');
		});

		it('should silently fail on write errors', () => {
			// Use an invalid path that will cause fs operations to fail
			configureInspectPerformance({ exportPath: '/nonexistent/root/path/that/cannot/be/created' });
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			const measurements: Measurement[] = [{ path: 'TestMethod', depth: 0, duration: 100, label: 'TestMethod' }];

			// Should not throw even when export fails
			expect(() => logSummary(measurements, true)).not.toThrow();
			// Log should still be called
			expect(logMessages).toHaveLength(1);
		});

		it('should include aggregated stats in exported JSON', () => {
			configureInspectPerformance({ exportPath: '.test-track-time' });

			const measurements: Measurement[] = [
				{ path: 'Root', depth: 0, duration: 100, label: 'Root' },
				{ path: 'Root -> Child', depth: 1, duration: 30, label: 'Child' },
				{ path: 'Root -> Child', depth: 1, duration: 20, label: 'Child' },
			];

			logSummary(measurements, true);

			const files = fs.readdirSync(testExportDir);
			const content = JSON.parse(fs.readFileSync(path.join(testExportDir, files[0]), 'utf-8')) as PerformanceReport;

			expect(content.aggregated).toBeDefined();
			expect(content.aggregated.Child.calls).toBe(2);
			expect(content.aggregated.Child.totalMs).toBe(50);
		});
	});

	describe('tree output formatting', () => {
		describe('when self duration is different from total duration', () => {
			it('should show self duration, too', async () => {
				const logMessages: PerformanceLogMessage[] = [];
				setPerformanceLogger((msg) => logMessages.push(msg));

				class ChildService {
					@InspectPerformance()
					public async work(): Promise<void> {
						await new Promise((resolve) => setTimeout(resolve, 15));
					}
				}

				class ParentService {
					constructor(private readonly child: ChildService) {}

					@InspectPerformance()
					public async process(): Promise<void> {
						await this.child.work();
					}
				}

				const child = new ChildService();
				const parent = new ParentService(child);
				await parent.process();

				expect(logMessages).toHaveLength(1);
				// The output should contain both parent and child with timing info
				const output = logMessages[0].treeOutput;
				expect(output).toContain('ParentService.process');
				expect(output).toContain('ChildService.work');
				// Should show indentation for child
				expect(output).toContain('-> ');
			});
		});

		it('should properly indent deeply nested calls', async () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class Level3 {
				@InspectPerformance()
				public async method(): Promise<string> {
					return await Promise.resolve('level3');
				}
			}

			class Level2 {
				constructor(private readonly level3: Level3) {}

				@InspectPerformance()
				public async method(): Promise<string> {
					return await this.level3.method();
				}
			}

			class Level1 {
				constructor(private readonly level2: Level2) {}

				@InspectPerformance()
				public async method(): Promise<string> {
					return await this.level2.method();
				}
			}

			const level3 = new Level3();
			const level2 = new Level2(level3);
			const level1 = new Level1(level2);
			await level1.method();

			expect(logMessages).toHaveLength(1);
			const output = logMessages[0].treeOutput;

			// Verify all three levels are present
			expect(output).toContain('Level1.method');
			expect(output).toContain('Level2.method');
			expect(output).toContain('Level3.method');
		});
	});

	describe('multiple sequential root calls', () => {
		it('should create separate reports for each root call', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public methodA(): string {
					return 'a';
				}

				@InspectPerformance()
				public methodB(): string {
					return 'b';
				}
			}

			const service = new TestService();
			service.methodA();
			service.methodB();

			expect(logMessages).toHaveLength(2);
			expect(logMessages[0].treeOutput).toContain('TestService.methodA');
			expect(logMessages[1].treeOutput).toContain('TestService.methodB');
		});
	});

	describe('return value handling', () => {
		it('should handle undefined return value', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public returnsUndefined(): undefined {
					return undefined;
				}
			}

			const service = new TestService();
			const result = service.returnsUndefined();

			expect(result).toBeUndefined();
			expect(logMessages).toHaveLength(1);
		});

		it('should handle null return value', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public returnsNull(): null {
					return null;
				}
			}

			const service = new TestService();
			const result = service.returnsNull();

			expect(result).toBeNull();
			expect(logMessages).toHaveLength(1);
		});

		it('should preserve this context', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				private value = 42;

				@InspectPerformance()
				public getValue(): number {
					return this.value;
				}
			}

			const service = new TestService();
			const result = service.getValue();

			expect(result).toBe(42);
		});

		it('should handle object return values', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public getObject(): { id: number; name: string } {
					return { id: 1, name: 'test' };
				}
			}

			const service = new TestService();
			const result = service.getObject();

			expect(result).toEqual({ id: 1, name: 'test' });
			expect(logMessages).toHaveLength(1);
		});
	});

	describe('async error in nested calls', () => {
		describe('when child method throws an error', () => {
			it('should propagate error and still log', async () => {
				const logMessages: PerformanceLogMessage[] = [];
				setPerformanceLogger((msg) => logMessages.push(msg));

				class ChildService {
					@InspectPerformance()
					public async failingMethod(): Promise<void> {
						await Promise.resolve();
						throw new Error('Child error');
					}
				}

				class ParentService {
					constructor(private readonly child: ChildService) {}

					@InspectPerformance()
					public async process(): Promise<void> {
						await this.child.failingMethod();
					}
				}

				const child = new ChildService();
				const parent = new ParentService(child);

				await expect(parent.process()).rejects.toThrow('Child error');
				expect(logMessages).toHaveLength(1);
				expect(logMessages[0].treeOutput).toContain('ParentService.process');
				expect(logMessages[0].treeOutput).toContain('ChildService.failingMethod');
			});
		});
	});

	describe('PerformanceLogMessage structure', () => {
		it('should have correct message property', () => {
			const logMessages: PerformanceLogMessage[] = [];
			setPerformanceLogger((msg) => logMessages.push(msg));

			class TestService {
				@InspectPerformance()
				public method(): void {
					// empty
				}
			}

			const service = new TestService();
			service.method();

			expect(logMessages[0].message).toBe('Performance Summary');
			expect(logMessages[0].treeOutput).toBeDefined();
			expect(logMessages[0].aggregated).toBeDefined();
		});
	});
});
