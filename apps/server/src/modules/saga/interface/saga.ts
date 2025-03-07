import { SagaStep } from "./saga-step";

export interface Saga<T = unknown> {
    name: string;
    flow: SagaStep['sagaName'][];
    invoke(data?: T): Promise<string>;
}
