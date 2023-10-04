import { EntityId } from '@shared/domain';

// TODO: I don't really like it, that this is in the type-folder, because the other types describe things coming from the database,
// while this query comes from the API. Maybe make a separate query-folder, but not sure.
export interface SchoolQuery {
	federalStateId?: EntityId;
}
