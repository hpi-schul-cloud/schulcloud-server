import { Configuration } from '@hpi-schul-cloud/commons';

export class Config {
	private static _instance: Config;

	private readonly _isEnabled: boolean;

	get isEnabled(): boolean {
		return this._isEnabled;
	}

	private readonly _route: string;

	get route(): string {
		return this._route;
	}

	private readonly _port: number;

	get port(): number {
		return this._port;
	}

	private readonly _collectDefaultMetrics: boolean;

	get collectDefaultMetrics(): boolean {
		return this._collectDefaultMetrics;
	}

	private readonly _collectMetricsRouteMetrics: boolean;

	get collectMetricsRouteMetrics(): boolean {
		return this._collectMetricsRouteMetrics;
	}

	private constructor() {
		this._isEnabled = Configuration.get('FEATURE_PROMETHEUS_METRICS_ENABLED') as boolean;
		this._route = Configuration.get('PROMETHEUS_METRICS_ROUTE') as string;
		this._port = Configuration.get('PROMETHEUS_METRICS_PORT') as number;
		this._collectDefaultMetrics = Configuration.get('PROMETHEUS_METRICS_COLLECT_DEFAULT_METRICS') as boolean;
		this._collectMetricsRouteMetrics = Configuration.get('PROMETHEUS_METRICS_COLLECT_METRICS_ROUTE_METRICS') as boolean;
	}

	public static get instance() {
		if (this._instance === undefined) {
			this._instance = new this();
		}

		return this._instance;
	}

	public static reload() {
		this._instance = new this();
	}
}
