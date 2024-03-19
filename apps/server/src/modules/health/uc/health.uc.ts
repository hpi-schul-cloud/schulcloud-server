import { Injectable } from '@nestjs/common';

import { HealthService } from '../service';
import { HealthConfig } from '../health.config';
import { HealthStatuses, HealthStatusCheck, HealthStatus } from '../domain';

const selfOnlyHealthDescription = 'Service health status (self-only)';

const overallHealthDescription = 'Service health status (overall)';

const mongoDBUpsertOperationTime = 'mongoDB:upsertOperationTime';

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
export class HealthUC {
	constructor(private readonly healthService: HealthService) {}

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
		// The below check allows for turning off the MongoDB dependency on the health check -
		// it shouldn't be typically used, but if this health check will be used e.g. in the k8s
		// liveness or readiness probes and, for any reason, there would be a need to stop
		// including MongoDB check in the overall API health checks, the HEALTH_CHECKS_EXCLUDE_MONGODB
		// config var can be set to 'true' to disable it. This way, as currently only this single
		// MongoDB check is included in the overall API health checks, the whole health check will
		// not perform any additional checks on any of the 3rd party services and thus will behave
		// like the self-only API health check.
		if (HealthConfig.instance.excludeMongoDB) {
			return new HealthStatus({
				status: HealthStatuses.STATUS_PASS,
				description: overallHealthDescription,
			});
		}

		const upsertOperationDate = new Date();
		const startTime = performance.now();

		try {
			let healthCheckID = 'db-health-check';

			// If hostname is available in the health module
			// config, append it to the health check ID.
			if (HealthConfig.instance.hostname !== '') {
				healthCheckID += `-${HealthConfig.instance.hostname}`;
			}

			await this.healthService.upsertHealthCheckById(healthCheckID);
		} catch (error) {
			// If any error occurred in the database operation execution it should be indicated
			// as a MongoDB check failure (and thus the whole health check should fail).

			const endTime = performance.now();

			const errorMessage = hasMessage(error) ? error.message : JSON.stringify(error);

			return new HealthStatus({
				status: HealthStatuses.STATUS_FAIL,
				output: `'${mongoDBUpsertOperationTime}' check error: ${errorMessage}`,
				description: overallHealthDescription,
				checks: {
					[mongoDBUpsertOperationTime]: [
						new HealthStatusCheck({
							componentType: datastoreComponentType,
							observedValue: endTime - startTime,
							observedUnit: observedUnitMs,
							status: HealthStatuses.STATUS_FAIL,
							time: upsertOperationDate,
							output: errorMessage,
						}),
					],
				},
			});
		}

		const endTime = performance.now();

		// Prepare the passed health status with
		// the performed upsert operation time.
		return new HealthStatus({
			status: HealthStatuses.STATUS_PASS,
			description: overallHealthDescription,
			checks: {
				[mongoDBUpsertOperationTime]: [
					new HealthStatusCheck({
						componentType: datastoreComponentType,
						observedValue: endTime - startTime,
						observedUnit: observedUnitMs,
						status: HealthStatuses.STATUS_PASS,
						time: upsertOperationDate,
					}),
				],
			},
		});
	}
}
