import { LearnroomMetadata } from '@shared/domain/types';

export interface Learnroom {
	getMetadata: () => LearnroomMetadata;
}

/**
 * @Deprecated
 */
export interface LearnroomElement {
	publish: () => void;
	unpublish: () => void;
}
