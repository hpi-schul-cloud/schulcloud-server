import { EntityId } from '../../../shared/domain';
import { NewsTargetModelValue } from '../entity';

export interface ICreateNews {
	title: string;
	content: string;
	displayAt: Date;
}

export interface IUpdateNews extends Partial<ICreateNews> {}

export interface INewsScope {
	// TODO clarify on singular vs plural: e.g. 'courses' vs 'school'
	// do not use the collection name!
	// we should use the entity instead here (which is then mapped to the collection)
	// see News entity definition
	target?:
		| {
				targetModel: 'school';
		  }
		| { targetModel: NewsTargetModelValue; targetId?: EntityId };
	unpublished?: boolean;
}
