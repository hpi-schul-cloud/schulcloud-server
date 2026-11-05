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

interface DependencyHealthCheckResult {
	name: string;
	check: HealthStatusCheck;
	output?: string;
}

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

function getErrorMessage(error: unknown): string {
	if (hasMessage(error)) return error.message;

	try {
		return JSON.stringify(error) ?? String(error);
	} catch {
		return String(error);
	}
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
		const results = [await this.checkMongoDBHealth(), await this.checkSessionStorageHealth()].filter(
			(result): result is DependencyHealthCheckResult => result !== undefined
		);
		const checks = Object.fromEntries(results.map(({ name, check }) => [name, [check]]));
		const outputs = results.flatMap(({ output }) => (output ? [output] : []));
		const failed = results.some(({ check }) => !check.isPassed());

		return new HealthStatus({
			status: failed ? HealthStatuses.STATUS_FAIL : HealthStatuses.STATUS_PASS,
			description: overallHealthDescription,
			output: outputs.length > 0 ? outputs.join('; ') : undefined,
			checks: Object.keys(checks).length > 0 ? checks : undefined,
		});
	}

	private checkMongoDBHealth(): Promise<DependencyHealthCheckResult> | undefined {
		if (this.healthConfig.excludeMongoDB) return undefined;

		let healthCheckID = 'db-health-check';
		if (this.healthConfig.hostname !== '') healthCheckID += `-${this.healthConfig.hostname}`;

		return this.checkDependencyHealth(mongoDBUpsertOperationTime, () =>
			this.healthService.upsertHealthCheckById(healthCheckID)
		);
	}

	private checkSessionStorageHealth(): Promise<DependencyHealthCheckResult> | undefined {
		const { sessionStorage } = this;
		if (!sessionStorage || this.healthConfig.excludeSessionStorage) return undefined;

		const key = `health-check-${Date.now()}-${Math.random()}`;

		return this.checkDependencyHealth(sessionStorageOperationTime, async () => {
			await sessionStorage.set(key, 'ok', 10);
			await sessionStorage.del(key);
		});
	}

	private async checkDependencyHealth(
		name: string,
		operation: () => Promise<unknown>
	): Promise<DependencyHealthCheckResult> {
		const checkTime = new Date();
		const startTime = performance.now();
		let errorMessage: string | undefined;
		let failed = false;

		try {
			await operation();
		} catch (error) {
			failed = true;
			this.logger.warning(new ErrorLoggable(error));
			errorMessage = getErrorMessage(error);
		}

		return {
			name,
			output: failed ? `'${name}' check error: ${errorMessage}` : undefined,
			check: new HealthStatusCheck({
				componentType: datastoreComponentType,
				observedValue: performance.now() - startTime,
				observedUnit: observedUnitMs,
				status: failed ? HealthStatuses.STATUS_FAIL : HealthStatuses.STATUS_PASS,
				time: checkTime,
				output: errorMessage,
			}),
		};
	}
}
