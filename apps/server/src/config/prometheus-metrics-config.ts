import { Configuration } from '@hpi-schul-cloud/commons';

export class PrometheusMetricsConfig {
	private readonly _isEnabledConfigKey = 'FEATURE_PROMETHEUS_METRICS_ENABLED';

	private readonly _routeConfigKey = 'PROMETHEUS_METRICS_ROUTE';

	private readonly _portConfigKey = 'PROMETHEUS_METRICS_PORT';

	private static _instance: PrometheusMetricsConfig;

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

	private constructor() {
		this._isEnabled = Configuration.get(this._isEnabledConfigKey) as boolean;
		this._route = Configuration.get(this._routeConfigKey) as string;
		this._port = Configuration.get(this._portConfigKey) as number;
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
