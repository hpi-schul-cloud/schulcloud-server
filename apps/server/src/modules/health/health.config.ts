import { Configuration } from '@hpi-schul-cloud/commons';

export class HealthConfig {
	private static _instance: HealthConfig;

	private readonly _exclude_mongodb_read_op_time_check: boolean;

	get excludeMongoDBReadOpTimeCheck(): boolean {
		return this._exclude_mongodb_read_op_time_check;
	}

	private constructor() {
		this._exclude_mongodb_read_op_time_check = Configuration.get('HEALTHCHECKS_EXCLUDE_MONGODB') as boolean;
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
