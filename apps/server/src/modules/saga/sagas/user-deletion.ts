import { Saga } from "../interface/saga";
import { SagaStep } from "../interface/saga-steps";
import { SagaInjectionService } from "../service/injection";
import { SagaCompensateFn } from "../type/saga-compensate-function";

type Compensation = {fn: SagaCompensateFn, step: SagaStep};


export class UserDeletionSaga implements Saga {
    name = 'user-deletion';

    // in case we want to allow parallel execution of steps we could have a list of lists
    flow: SagaStep['sagaName'][] = [
        'delete-user-from-class',
        'delete-user-from-news', // not implemented yet
    ]

    constructor(
        private readonly sagaInjectionService: SagaInjectionService
    ) { }

    private async compensate(compensations: Compensation[]): Promise<void> {
        try {
            for (const compensate of compensations) {
                await compensate.fn();
                console.log(`Compensated for step ${compensate.step.stepName}`);
            }
        } catch (error) {
            console.error(`Compensation failed for step ${compensations[0].step.stepName}`, error);
        }
    }

    public async invoke(userId: string): Promise<string> {
        const steps = this.flow.map((stepName) => {
            const step = this.sagaInjectionService.getSagaStep(this.name, stepName);
            if (!step) {
                throw new Error(`Saga step ${stepName} not found for saga ${this.name}`);
            }
            return step
        });

        const compensations: Compensation[] = [];

        let currentStep: SagaStep | null = null;
        try {
            for (const step of steps) {
                currentStep = step;
                const compensate = await step.invoke(userId);
                compensations.push({fn: compensate, step});
            }
        } catch (error) {
            const logMessage = `User deletion saga failed for user ${userId} at step ${currentStep?.stepName}. Initiating compensations...`;
            console.error(logMessage, error);
            await this.compensate(compensations);

            return logMessage;
        }

        // all good
        return `User deletion saga executed successfully for user ${userId}`;
    }
}