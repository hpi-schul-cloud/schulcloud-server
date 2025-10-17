import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Summary, register } from 'prom-client';

@Injectable()
export class MetricsService {
	private totalUserCounter: Gauge<string>;

	private totalBoardCounter: Gauge<string>;

	private executionTimesSummary: Map<string, Summary<string>> = new Map();

	private actionCounters: Map<string, Counter<string>> = new Map();

	private actionGauges: Map<string, Gauge<string>> = new Map();

	constructor() {
		this.totalUserCounter = new Gauge({
			name: 'sc_boards_total_users',
			help: 'Total number of users connected to boards per pod',
		});

		this.totalBoardCounter = new Gauge({
			name: 'sc_boards_total_boards',
			help: 'Total number of boards per pod',
		});

		register.registerMetric(this.totalUserCounter);
		register.registerMetric(this.totalBoardCounter);
	}

	public setExecutionTime(actionName: string, value: number): void {
		let summary = this.executionTimesSummary.get(actionName);

		if (!summary) {
			summary = new Summary({
				name: `sc_boards_execution_time_${actionName}`,
				help: 'Average execution time of a specific action in milliseconds',
				maxAgeSeconds: 30,
				ageBuckets: 5,
				percentiles: [0.01, 0.1, 0.5, 0.9, 0.99],
				pruneAgedBuckets: true,
			});
			this.executionTimesSummary.set(actionName, summary);
			register.registerMetric(summary);
		}
		summary.observe(value);
	}

	public setTotalUserCount(value: number): void {
		this.totalUserCounter.set(value);
	}

	public setTotalBoardCount(value: number): void {
		this.totalBoardCounter.set(value);
	}

	public incrementActionCount(actionName: string): void {
		let counter = this.actionCounters.get(actionName);

		if (!counter) {
			counter = new Counter({
				name: `sc_boards_count_${actionName}`,
				help: 'Number of calls for a specific action per minute',
				// async collect() {
				// 	// Invoked when the registry collects its metrics' values.
				// 	const currentValue = await somethingAsync();
				// 	this.set(currentValue);
				// },
			});
			this.actionCounters.set(actionName, counter);
			register.registerMetric(counter);
		}
		counter.inc();
	}

	public incrementActionGauge(actionName: string): void {
		let counter = this.actionGauges.get(actionName);

		if (!counter) {
			counter = new Gauge({
				name: `sc_boards_actions_gauge_${actionName}`,
				help: 'Number of calls for a specific action per minute',
				// async collect() {
				// 	// Invoked when the registry collects its metrics' values.
				// 	const currentValue = await somethingAsync();
				// 	this.set(currentValue);
				// },
			});
			this.actionGauges.set(actionName, counter);
			register.registerMetric(counter);
		}
		counter.inc();
	}
}
