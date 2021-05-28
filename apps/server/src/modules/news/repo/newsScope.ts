import { FilterQuery } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { News } from '../entity';
import { NewsTargetFilter } from './newsTargetFilter';

export class NewsScope {
	query: FilterQuery<News> = {};

	bySchool(schoolId: EntityId) {
		this.addQuery({ school: schoolId });
		return this;
	}

	// targets + school target
	byAllTargets(targets: NewsTargetFilter[]) {
		const queries: FilterQuery<News>[] = targets.map((target) => this.getTargetQuery(target));
		queries.push(this.getEmptyTargetQuery());
		this.addQuery({ $or: queries });
		return this;
	}

	// single target
	byTarget(target: NewsTargetFilter) {
		this.addQuery(this.getTargetQuery(target));
		return this;
	}

	byEmptyTarget() {
		this.addQuery(this.getEmptyTargetQuery());
		return this;
	}

	byUnpublished(unpublished: boolean) {
		const now = new Date();
		this.addQuery({ displayAt: unpublished ? { $gt: now } : { $lte: now } });
		return this;
	}

	private addQuery(query: FilterQuery<News>) {
		if (Object.keys(this.query).length === 0) {
			this.query = query;
		} else if (Array.isArray(this.query.$and)) {
			this.query.$and.push(query);
		} else {
			this.query = { $and: [{ ...this.query }, query] };
		}
	}

	private getTargetQuery(target: NewsTargetFilter): FilterQuery<News> {
		return { $and: [{ targetModel: target.targetModel }, { 'target:in': target.targetIds }] };
	}

	private getEmptyTargetQuery() {
		return { $and: [{ targetModel: null }, { target: null }] };
	}
}
