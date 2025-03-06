import { SagaCompensateFn } from "../type/saga-compensate-function";


export interface SagaStep<T = any> {
    sagaName: string;
    stepName: string; // grouped by sagaName
	invoke(data: T): Promise<SagaCompensateFn>; // e.g. userId for deletion, can be different for each step
    metadata: {
        moduleName: string; // use enum
    }
}
