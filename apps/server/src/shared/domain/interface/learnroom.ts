import { LearnroomMetadata } from '@shared/domain/types';

export interface ILearnroom {
	getMetadata: () => LearnroomMetadata;
}

export interface LearnroomElement {
	publish: () => void;
	unpublish: () => void;
}
