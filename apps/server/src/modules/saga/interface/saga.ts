import { SagaStep } from "./saga-steps";

export interface Saga<T = any> {
    name: string;
    flow: SagaStep['sagaName'][];
    invoke(data?: T): Promise<string>;
}
