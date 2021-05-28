import { FilterQuery } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { News } from '../entity';
import { NewsTargetFilter } from './news-target-filter';

export class NewsScope {
	private _queries: FilterQuery<News>[] = [];

	get query(): FilterQuery<News> {
		const query = this._queries.length > 1 ? { $and: this._queries } : this._queries[0];
		return query;
	}

	bySchool(schoolId: EntityId): NewsScope {
		this.addQuery({ school: schoolId });
		return this;
	}

	// targets + school target
	byAllTargets(targets: NewsTargetFilter[]): NewsScope {
		const queries: FilterQuery<News>[] = targets.map((target) => this.getTargetQuery(target));
		queries.push(this.getEmptyTargetQuery());
		this.addQuery({ $or: queries });
		return this;
	}

	// single target
	byTarget(target: NewsTargetFilter): NewsScope {
		this.addQuery(this.getTargetQuery(target));
		return this;
	}

	byEmptyTarget(): NewsScope {
		this.addQuery(this.getEmptyTargetQuery());
		return this;
	}

	byUnpublished(unpublished: boolean): NewsScope {
		const now = new Date();
		this.addQuery({ displayAt: unpublished ? { $gt: now } : { $lte: now } });
		return this;
	}

	private addQuery(query: FilterQuery<News>) {
		this._queries.push(query);
	}

	private getTargetQuery(target: NewsTargetFilter): FilterQuery<News> {
		return { $and: [{ targetModel: target.targetModel }, { 'target:in': target.targetIds }] };
	}

	private getEmptyTargetQuery() {
		return { $and: [{ targetModel: null }, { target: null }] };
	}
}
