import { ErrorLoggable } from '@infra/error';
import { Logger } from '@infra/logger';
import { type StorageClient } from '@infra/valkey-client';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { HealthStatus, HealthStatusCheck, HealthStatuses } from '../domain';
import { HEALTH_CONFIG_TOKEN, HealthConfig } from '../health.config';
import { HEALTH_SESSION_STORAGE_CLIENT } from '../health.constants';
import { HealthService } from '../service';

const selfOnlyHealthDescription = 'Service health status (self-only)';

const overallHealthDescription = 'Service health status (overall)';

const mongoDBUpsertOperationTime = 'mongoDB:upsertOperationTime';
const sessionStorageOperationTime = 'sessionStorage:operationTime';

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
	constructor(
		private readonly healthService: HealthService,
		private readonly logger: Logger,
		@Inject(HEALTH_CONFIG_TOKEN) private readonly healthConfig: HealthConfig,
		@Optional() @Inject(HEALTH_SESSION_STORAGE_CLIENT) private readonly sessionStorage?: StorageClient
	) {
		this.logger.setContext(HealthUC.name);
	}

	public checkSelfHealth(): HealthStatus {
		// This health check verifies just the correct module setup and doesn't include
		// any additional check on any of the internal or external 3rd party services.
		// It can be used to verify if application is just alive, but it doesn't provide
		// any verification on the complete application's readiness.
		return new HealthStatus({
			status: HealthStatuses.STATUS_PASS,
			description: selfOnlyHealthDescription,
		});
	}

	public async checkOverallHealth(): Promise<HealthStatus> {
		// MongoDB can be excluded for deployments that need an independent health check.
		// Session storage is still checked when configured because the server depends on it.
		const checks: Record<string, HealthStatusCheck[]> = {};
		const outputs: string[] = [];

		if (!this.healthConfig.excludeMongoDB) {
			const checkTime = new Date();
			const startTime = performance.now();
			let errorMessage: string | undefined;
			try {
				let healthCheckID = 'db-health-check';
				if (this.healthConfig.hostname !== '') healthCheckID += `-${this.healthConfig.hostname}`;
				await this.healthService.upsertHealthCheckById(healthCheckID);
			} catch (error) {
				this.logger.warning(new ErrorLoggable(error));
				errorMessage = hasMessage(error) ? error.message : JSON.stringify(error);
				outputs.push(`'${mongoDBUpsertOperationTime}' check error: ${errorMessage}`);
			}
			checks[mongoDBUpsertOperationTime] = [
				new HealthStatusCheck({
					componentType: datastoreComponentType,
					observedValue: performance.now() - startTime,
					observedUnit: observedUnitMs,
					status: errorMessage ? HealthStatuses.STATUS_FAIL : HealthStatuses.STATUS_PASS,
					time: checkTime,
					output: errorMessage,
				}),
			];
		}

		if (this.sessionStorage) {
			const checkTime = new Date();
			const startTime = performance.now();
			const key = `health-check-${Date.now()}-${Math.random()}`;
			let errorMessage: string | undefined;
			try {
				await this.sessionStorage.set(key, 'ok', 10);
				await this.sessionStorage.del(key);
			} catch (error) {
				this.logger.warning(new ErrorLoggable(error));
				errorMessage = hasMessage(error) ? error.message : JSON.stringify(error);
				outputs.push(`'${sessionStorageOperationTime}' check error: ${errorMessage}`);
			}
			checks[sessionStorageOperationTime] = [
				new HealthStatusCheck({
					componentType: datastoreComponentType,
					observedValue: performance.now() - startTime,
					observedUnit: observedUnitMs,
					status: errorMessage ? HealthStatuses.STATUS_FAIL : HealthStatuses.STATUS_PASS,
					time: checkTime,
					output: errorMessage,
				}),
			];
		}

		const failed = Object.values(checks).some((componentChecks) => componentChecks.some((check) => !check.isPassed()));
		return new HealthStatus({
			status: failed ? HealthStatuses.STATUS_FAIL : HealthStatuses.STATUS_PASS,
			description: overallHealthDescription,
			output: outputs.length > 0 ? outputs.join('; ') : undefined,
			checks: Object.keys(checks).length > 0 ? checks : undefined,
		});
	}
}
