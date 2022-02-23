import { LearnroomMetadata } from '@shared/domain/types';

export interface ILearnroom {
	getMetadata: () => LearnroomMetadata;
}

export interface ILearnroomElement {
	publish: () => void;
	unpublish: () => void;
}
