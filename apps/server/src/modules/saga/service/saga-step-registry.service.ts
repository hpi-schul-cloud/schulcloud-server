import { Injectable } from '@nestjs/common';
import { ModuleName, SagaStep, StepType } from '../type';

@Injectable()
export class SagaStepRegistryService {
	private steps: Map<ModuleName, Map<keyof StepType, SagaStep<keyof StepType>>> = new Map();

	public registerStep<T extends keyof StepType>(moduleName: ModuleName, step: SagaStep<T>): void {
		if (!this.steps.has(moduleName)) {
			this.steps.set(moduleName, new Map());
		}
		this.steps.get(moduleName)!.set(step.name, step);
	}

	public hasStep(moduleName: ModuleName, name: keyof StepType): boolean {
		const moduleSteps = this.steps.get(moduleName);
		return moduleSteps ? moduleSteps.has(name) : false;
	}

	public checkStep(moduleName: ModuleName, name: keyof StepType): void {
		if (!this.hasStep(moduleName, name)) {
			throw new Error(`Step ${name} in module ${moduleName} is not registered.`);
		}
	}

	async executeStep<T extends keyof StepType>(
		moduleName: ModuleName,
		name: T,
		params: StepType[T]['params']
	): Promise<StepType[T]['result']> {
		const moduleSteps = this.steps.get(moduleName);
		if (!moduleSteps) {
			throw new Error(`Module ${moduleName} is not registered.`);
		}
		const step = moduleSteps.get(name);
		if (!step) {
			throw new Error(`Step ${name} in module ${moduleName} is not registered.`);
		}
		return step.execute(params);
	}
}
