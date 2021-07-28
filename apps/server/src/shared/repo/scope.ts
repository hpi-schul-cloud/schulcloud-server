import { FilterQuery } from '@mikro-orm/core';
import { EmptyResultQuery } from './query/empty-result.query';

export class Scope<T> {
	private _queries: FilterQuery<T>[] = [];

	get query(): FilterQuery<T> {
		if (this._queries.length === 0) {
			return EmptyResultQuery as FilterQuery<T>;
		}
		const query = this._queries.length > 1 ? { $and: this._queries } : this._queries[0];
		return query as FilterQuery<T>;
	}

	addQuery(query: FilterQuery<T>): void {
		this._queries.push(query);
	}
}
