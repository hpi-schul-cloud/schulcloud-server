import { FilterQuery } from '@mikro-orm/core';
import { EmptyResultQuery, Scope } from '@shared/repo';
import { News } from '../entity';
import { NewsTargetFilter } from './news-target-filter';

export class NewsScope extends Scope<News> {
	byTargets(targets: NewsTargetFilter[]): NewsScope {
		const queries: FilterQuery<News>[] = targets.map((target) => {
			return { $and: [{ targetModel: target.targetModel }, { 'target:in': target.targetIds }] };
		});
		if (queries.length === 0) {
			// mission impossile query to ensure empty query result
			this.addQuery(EmptyResultQuery);
		} else if (queries.length === 1) {
			this.addQuery(queries[0]);
		} else {
			this.addQuery({ $or: queries });
		}
		return this;
	}

	byUnpublished(unpublished: boolean): NewsScope {
		const now = new Date();
		this.addQuery({ displayAt: unpublished ? { $gt: now } : { $lte: now } });
		return this;
	}
}
