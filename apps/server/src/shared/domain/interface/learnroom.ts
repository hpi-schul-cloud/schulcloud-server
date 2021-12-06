import { LearnroomMetadata } from '@shared/domain/types';

export interface ILearnroom {
	getMetadata: () => LearnroomMetadata;
}
