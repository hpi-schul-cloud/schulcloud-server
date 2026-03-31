import { AsyncLocalStorage } from 'node:async_hooks';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Types
// ============================================================================

export interface Measurement {
	path: string; // Concatenated call stack path (e.g., "A -> B -> C")
	depth: number; // Call stack depth (0-based)
	duration: number; // Total duration including children
	selfDuration?: number; // Duration excluding tracked children (calculated post-hoc)
	label: string; // The leaf method name
}

export interface AggregatedStats {
	calls: number;
	totalMs: number;
	avgMs: number;
	minMs: number;
	maxMs: number;
}

export interface PerformanceReport {
	timestamp: string;
	rootLabel: string;
	totalDurationMs: number;
	measurements: Measurement[];
	aggregated: Record<string, AggregatedStats>;
}

export interface InspectPerformanceConfig {
	enabled: boolean;
	exportPath: string;
	logThresholdMs: number;
}

export interface PerformanceLogMessage {
	message: string;
	treeOutput: string;
	aggregated: string;
}

// ============================================================================
// Decorator
// ============================================================================

/**
 * Decorator that tracks the execution time of a method.
 * Tracks call stacks and builds a tree view when the root method completes.
 *
 * @param customLabel - Optional custom label. If not provided, uses `ClassName.methodName`
 *
 * @example
 * ```typescript
 * class UserService {
 *   @InspectPerformance()
 *   async findById(id: string): Promise<User> {
 *     return this.userRepo.findOne(id);
 *   }
 * }
 * ```
 */
export function InspectPerformance(customLabel?: string): MethodDecorator {
	return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
		const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
		const className = target.constructor.name;
		const methodName = String(propertyKey);
		const label = customLabel ?? `${className}.${methodName}`;

		descriptor.value = function (...args: unknown[]): unknown {
			if (!globalConfig.enabled) {
				return originalMethod.apply(this, args);
			}

			const parentContext = getContext();

			// If no context exists, create a new one (this is the root call)
			if (!parentContext) {
				const rootContext: PerformanceContext = {
					currentPath: label,
					depth: 0,
					measurements: [],
					rootLabel: label,
				};
				return asyncLocalStorage.run(rootContext, () =>
					executeWithTracking.call(this, label, originalMethod, args, true, rootContext)
				);
			}

			// Context exists, create a child context with extended path
			const childPath = `${parentContext.currentPath} -> ${label}`;
			const childContext: PerformanceContext = {
				currentPath: childPath,
				depth: parentContext.depth + 1,
				measurements: parentContext.measurements, // Share measurements array
				rootLabel: parentContext.rootLabel,
			};

			// Run in child context so concurrent async calls don't interfere
			return asyncLocalStorage.run(childContext, () =>
				executeWithTracking.call(this, label, originalMethod, args, false, childContext)
			);
		};

		return descriptor;
	};
}

// ============================================================================
// Configuration
// ============================================================================

const defaultConfig: InspectPerformanceConfig = {
	enabled: true,
	exportPath: '.track-time',
	logThresholdMs: 0,
};

let globalConfig: InspectPerformanceConfig = { ...defaultConfig };

/**
 * Configure the InspectPerformance decorator globally.
 */
export function configureInspectPerformance(config: Partial<InspectPerformanceConfig>): void {
	globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current configuration.
 */
export function getInspectPerformanceConfig(): InspectPerformanceConfig {
	return { ...globalConfig };
}

// ============================================================================
// Context Management (AsyncLocalStorage)
// ============================================================================

interface PerformanceContext {
	currentPath: string; // Immutable path for this call (e.g., "A -> B -> C")
	depth: number; // Current call depth
	measurements: Measurement[]; // Shared across all nested calls
	rootLabel: string | null;
}

const asyncLocalStorage = new AsyncLocalStorage<PerformanceContext>();

function getContext(): PerformanceContext | undefined {
	return asyncLocalStorage.getStore();
}

// ============================================================================
// ANSI Color Codes
// ============================================================================

const ANSI_LIGHT_BLUE = '\x1b[94m';
const ANSI_RESET = '\x1b[0m';

// ============================================================================
// Output Formatter
// ============================================================================

const TOTAL_TIME_WIDTH = 12;
const SELF_TIME_WIDTH = 12;

function formatDurationWithSelf(totalMs: number, selfMs: number | undefined): string {
	const totalFormatted = `${totalMs.toFixed(2)}ms`.padStart(TOTAL_TIME_WIDTH);

	// If self time differs from total, show both
	const doesDurationDiffer = selfMs !== undefined && Math.abs(totalMs - selfMs) > 0.01;
	const selfFormatted = doesDurationDiffer
		? `${selfMs.toFixed(2)}ms`.padStart(SELF_TIME_WIDTH)
		: ' '.repeat(SELF_TIME_WIDTH);
	return `| ${ANSI_LIGHT_BLUE}${totalFormatted}${ANSI_RESET} | ${ANSI_LIGHT_BLUE}${selfFormatted}${ANSI_RESET} |`;
}

/**
 * Calculate self durations for all measurements.
 * Self duration = total duration - sum of direct children's durations.
 */
function calculateSelfDurations(measurements: Measurement[]): void {
	for (const m of measurements) {
		// Find direct children: same path prefix + one level deeper
		const childPrefix = `${m.path} -> `;
		const directChildren = measurements.filter(
			(child) => child.depth === m.depth + 1 && child.path.startsWith(childPrefix)
		);

		const childrenTotalTime = directChildren.reduce((sum, child) => sum + child.duration, 0);
		m.selfDuration = Math.max(0, m.duration - childrenTotalTime);
	}
}

/**
 * Format measurements with indentation based on depth.
 * Shows only the leaf method name, with 2-space indentation per depth level.
 * Measurements are sorted by path alphabetically.
 * Displays both total time and self time (when different).
 */
function formatMeasurementsOutput(measurements: Measurement[]): string[] {
	// Calculate self durations before formatting
	calculateSelfDurations(measurements);

	// Sort measurements by path
	const sorted = [...measurements].sort((a, b) => a.path.localeCompare(b.path));

	const lines: string[] = [];

	for (const m of sorted) {
		const timeStr = formatDurationWithSelf(m.duration, m.selfDuration);
		const indent = '  '.repeat(m.depth);
		const prefix = m.depth > 0 ? '-> ' : '';
		lines.push(`${timeStr}: ${indent}${prefix}${m.label}`);
	}

	return lines;
}

export function formatAggregatedStats(aggregated: Record<string, AggregatedStats>): string {
	const entries = Object.entries(aggregated);
	if (entries.length === 0) return '';

	const lines = entries.map(([label, stats]) => {
		if (stats.calls === 1) {
			return `${label}: ${stats.totalMs.toFixed(2)}ms`;
		}
		const avgFormatted = stats.avgMs.toFixed(2);
		const minFormatted = stats.minMs.toFixed(2);
		const maxFormatted = stats.maxMs.toFixed(2);
		const callCount = stats.calls;
		const total = stats.totalMs.toFixed(2);
		return `${label}: ${total}ms (calls: ${callCount}, avg: ${avgFormatted}ms, min: ${minFormatted}ms, max: ${maxFormatted}ms)`;
	});

	// Calculate total execution time across all measurements
	const totalExecutionTime = entries.reduce((sum, [, stats]) => sum + stats.totalMs, 0);
	const totalCalls = entries.reduce((sum, [, stats]) => sum + stats.calls, 0);
	lines.push(`Total execution time: ${totalExecutionTime.toFixed(2)}ms (${totalCalls} calls)`);

	return lines.join('\n');
}

// ============================================================================
// Aggregation
// ============================================================================

function aggregateFromMeasurements(measurements: Measurement[]): Record<string, AggregatedStats> {
	const stats: Record<string, AggregatedStats> = {};

	for (const m of measurements) {
		const existing = stats[m.label];
		if (existing) {
			existing.calls += 1;
			existing.totalMs += m.duration;
			existing.avgMs = existing.totalMs / existing.calls;
			existing.minMs = Math.min(existing.minMs, m.duration);
			existing.maxMs = Math.max(existing.maxMs, m.duration);
		} else {
			stats[m.label] = {
				calls: 1,
				totalMs: m.duration,
				avgMs: m.duration,
				minMs: m.duration,
				maxMs: m.duration,
			};
		}
	}

	return stats;
}

// ============================================================================
// JSON Export
// ============================================================================

function exportToJson(measurements: Measurement[], aggregated: Record<string, AggregatedStats>): void {
	if (!globalConfig.exportPath || measurements.length === 0) return;

	const rootMeasurement = measurements[0];
	const report: PerformanceReport = {
		timestamp: new Date().toISOString(),
		rootLabel: rootMeasurement.label,
		totalDurationMs: rootMeasurement.duration,
		measurements,
		aggregated,
	};

	const exportDir = path.resolve(process.cwd(), globalConfig.exportPath);

	try {
		if (!fs.existsSync(exportDir)) {
			fs.mkdirSync(exportDir, { recursive: true });
		}

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const safeLabel = rootMeasurement.label.replace(/[^a-zA-Z0-9.-]/g, '_');
		const filename = `${timestamp}_${safeLabel}.json`;
		const filepath = path.join(exportDir, filename);
		fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
	} catch {
		// Silently fail - don't break the application for export errors
	}
}

// ============================================================================
// Logger Interface
// ============================================================================

type LoggerFunction = (message: PerformanceLogMessage) => void;

let loggerFn: LoggerFunction | null = null;

/**
 * Set a custom logger function for performance summaries.
 * If not set, summaries will be logged via console.info.
 */
export function setPerformanceLogger(logger: LoggerFunction): void {
	loggerFn = logger;
}

function logSummary(measurements: Measurement[]): void {
	if (measurements.length === 0) return;
	if (measurements[0].duration < globalConfig.logThresholdMs) return;

	const aggregated = aggregateFromMeasurements(measurements);

	const outputLines = formatMeasurementsOutput(measurements);
	const treeOutput = outputLines.join('\n');
	const aggregatedOutput = formatAggregatedStats(aggregated);

	const logMessage: PerformanceLogMessage = {
		message: 'Performance Summary',
		treeOutput,
		aggregated: aggregatedOutput,
	};

	if (loggerFn) {
		loggerFn(logMessage);
	} else {
		const output = `[Performance]\n${treeOutput}\n\nAggregated:\n${aggregatedOutput}`;
		// eslint-disable-next-line no-console
		console.info(output);
	}

	// exportToJson(measurements, aggregated);
}

function executeWithTracking(
	this: unknown,
	label: string,
	originalMethod: (...args: unknown[]) => unknown,
	args: unknown[],
	isRoot: boolean,
	context: PerformanceContext
): unknown {
	const { currentPath, depth, measurements } = context;
	const startTime = performance.now();

	try {
		const result = originalMethod.apply(this, args);

		// Handle async methods
		if (result instanceof Promise) {
			return result
				.then((value: unknown) => {
					const duration = performance.now() - startTime;
					measurements.push({ path: currentPath, depth, duration, label });

					if (isRoot) {
						logSummary(measurements);
					}
					return value;
				})
				.catch((error: unknown) => {
					const duration = performance.now() - startTime;
					measurements.push({ path: currentPath, depth, duration, label });

					if (isRoot) {
						logSummary(measurements);
					}
					throw error;
				});
		}

		// Handle sync methods
		const duration = performance.now() - startTime;
		measurements.push({ path: currentPath, depth, duration, label });

		if (isRoot) {
			logSummary(measurements);
		}
		return result;
	} catch (error) {
		const duration = performance.now() - startTime;
		measurements.push({ path: currentPath, depth, duration, label });

		if (isRoot) {
			logSummary(measurements);
		}
		throw error;
	}
}
