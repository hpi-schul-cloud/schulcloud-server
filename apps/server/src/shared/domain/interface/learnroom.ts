import { LearnroomMetadata } from '../types/learnroom.types';

export interface ILearnroom {
	getMetadata: () => LearnroomMetadata;
}

export interface ILearnroomElement {
	publish: () => void;
	unpublish: () => void;
}
