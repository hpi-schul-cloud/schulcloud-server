import { FilterQuery } from '@mikro-orm/core';
import { News } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { EmptyResultQuery } from '../query';
import { Scope } from '../scope';
import { NewsTargetFilter } from './news-target-filter';

export class NewsScope extends Scope<News> {
	byTargets(targets: NewsTargetFilter[]): NewsScope {
		const queries: FilterQuery<News>[] = targets.map((target) => {
			return {
				$and: [{ targetModel: target.targetModel }, { 'target:in': target.targetIds }],
			};
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

	byPublished(): NewsScope {
		const now = new Date();
		this.addQuery({ displayAt: { $lte: now } });
		return this;
	}

	byUnpublished(): NewsScope {
		const now = new Date();
		this.addQuery({ displayAt: { $gt: now } });
		return this;
	}

	byCreator(creatorId: EntityId): NewsScope {
		if (creatorId !== undefined) {
			this.addQuery({ creator: creatorId });
		}
		return this;
	}

	byUpdater(updaterId: EntityId): NewsScope {
		if (updaterId !== undefined) {
			this.addQuery({ updater: updaterId });
		}
		return this;
	}
}
