import { NewsTarget } from '../entity';

export interface ICreateNews {
	title: string;
	content: string;
	displayAt: Date;
	target: NewsTarget;
}

export type IUpdateNews = Partial<ICreateNews>;

export interface INewsScope {
	// TODO clarify on singular vs plural: e.g. 'courses' vs 'school'
	// do not use the collection name!
	// we should use the entity instead here (which is then mapped to the collection)
	// see News entity definition
	target?: NewsTarget;
	unpublished?: boolean;
}
