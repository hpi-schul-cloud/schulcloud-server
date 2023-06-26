import { Injectable } from '@nestjs/common';

import { Configuration } from '@hpi-schul-cloud/commons';
import { HealthService } from '../service';
import { HealthConfig } from '../health.config';
import { HealthStatuses, HealthStatusCheck, HealthStatus } from '../domain';

const selfOnlyHealthDescription = 'Service health status (self-only)';

const overallHealthDescription = 'Service health status (overall)';

const mongoDBReadOperationTime = 'mongoDB:readOperationTime';

const datastoreComponentType = 'datastore';

const observedUnitMs = 'ms';

function hasMessage(error: unknown): error is { message: string } {
	// Check whether given error of an unknown type
	// has a 'message' field of a string type or not.
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as Record<string, unknown>).message === 'string'
	);
}

@Injectable()
export class HealthUc {
	private readonly mongoDBReadOpTimeHealthcheckEnabled: boolean = true;

	constructor(private readonly healthService: HealthService) {
		if (Configuration.has('HEALTHCHECKS_MONGODB_READ_OP_TIME_ENABLED')) {
			this.mongoDBReadOpTimeHealthcheckEnabled = Configuration.get(
				'HEALTHCHECKS_MONGODB_READ_OP_TIME_ENABLED'
			) as boolean;
		}
	}

	checkSelfHealth(): HealthStatus {
		// This health check verifies just the correct module setup and doesn't include
		// any additional check on any of the internal or external 3rd party services.
		// It can be used to verify if application is just alive, but it doesn't provide
		// any verification on the complete application's readiness.
		return new HealthStatus({
			status: HealthStatuses.STATUS_PASS,
			description: selfOnlyHealthDescription,
		});
	}

	async checkOverallHealth(): Promise<HealthStatus> {
		// The below check allows for turning off the MongoDB dependency on the healthcheck -
		// it shouldn't be typically used, but if this healthcheck will be used e.g. in the k8s
		// liveness or readiness probes and, for any reason, there would be a need to stop
		// including MongoDB read operation time check in the overall API health checks, the
		// HEALTHCHECKS_EXCLUDE_MONGODB config var can be set to 'true' to disable it. This way,
		// as currently only this single MongoDB read operation time check is included in the
		// overall API health checks, the whole health check will not perform any additional
		// checks on any of the 3rd party services and thus will behave like the self-only API
		// health check.
		if (HealthConfig.instance.excludeMongoDB) {
			return new HealthStatus({
				status: HealthStatuses.STATUS_PASS,
				description: overallHealthDescription,
			});
		}

		const readOperationDate = new Date();
		const startTime = performance.now();

		try {
			// The data returned by the find operation is currently not used so it's not
			// saved into any variable - we just want to check if the find operation has
			// been performed successfully (in a sense that no error occurred).
			await this.healthService.upsertHealthcheckById('api-db-healthcheck');
		} catch (error) {
			// If any error occurred in the find operation execution on the database,
			// it should be indicated as a MongoDB read operation time check failure
			// (and thus the whole healthcheck should fail).

			const endTime = performance.now();

			let errorMessage: string;

			if (hasMessage(error)) {
				errorMessage = error.message;
			} else {
				errorMessage = JSON.stringify(error);
			}

			return new HealthStatus({
				status: HealthStatuses.STATUS_FAIL,
				output: `'${mongoDBReadOperationTime}' check error: ${errorMessage}`,
				description: overallHealthDescription,
				checks: {
					[mongoDBReadOperationTime]: [
						new HealthStatusCheck({
							componentType: datastoreComponentType,
							observedValue: endTime - startTime,
							observedUnit: observedUnitMs,
							status: HealthStatuses.STATUS_FAIL,
							time: readOperationDate,
							output: errorMessage,
						}),
					],
				},
			});
		}

		const endTime = performance.now();

		// Prepare the health status as passed, whether the healthcheck document was present
		// in the database or not. The only case it should fail is the database connectivity
		// error as a plain 'find' operation is used within the healthchecks repository internally
		// (not 'find or fail') so the not found (null) document is also acceptable in case of
		// a read operation time check.
		return new HealthStatus({
			status: HealthStatuses.STATUS_PASS,
			description: overallHealthDescription,
			checks: {
				[mongoDBReadOperationTime]: [
					new HealthStatusCheck({
						componentType: datastoreComponentType,
						observedValue: endTime - startTime,
						observedUnit: observedUnitMs,
						status: HealthStatuses.STATUS_PASS,
						time: readOperationDate,
					}),
				],
			},
		});
	}
}
