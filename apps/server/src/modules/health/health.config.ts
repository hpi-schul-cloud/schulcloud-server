import { Configuration } from '@hpi-schul-cloud/commons';

export class HealthConfig {
	private static _instance: HealthConfig;

	private readonly _hostname: string;

	get hostname(): string {
		return this._hostname;
	}

	private readonly _exclude_mongodb: boolean;

	get excludeMongoDB(): boolean {
		return this._exclude_mongodb;
	}

	private constructor() {
		this._hostname = Configuration.has('HOSTNAME') ? (Configuration.get('HOSTNAME') as string) : '';
		this._exclude_mongodb = Configuration.get('HEALTH_CHECKS_EXCLUDE_MONGODB') as boolean;
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
