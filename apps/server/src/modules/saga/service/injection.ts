import { Injectable } from '@nestjs/common';
import { SagaStep } from '../interface/saga-step';

@Injectable()
export class SagaInjectionService {
	private readonly sagaSteps: SagaStep[] = [];

	public injectSagaStep(sagaStep: SagaStep): void {
        if (this.getSagaStep(sagaStep.sagaName, sagaStep.stepName)) {
            throw new Error(`Saga step ${sagaStep.stepName} already exists`);
        }
		this.sagaSteps.push(sagaStep);
	}

	public listSagaSteps(): SagaStep[] {
		return this.sagaSteps;
	}

    public listBySagaName(sagaName: string): SagaStep[] {
        return this.sagaSteps.filter((step) => step.sagaName === sagaName);
    }

    public getSagaStep(sagaName: string, stepName: string): SagaStep | null {
        return this.sagaSteps.find((step) => step.sagaName === sagaName && step.stepName === stepName) ?? null;
    }

}