/**
 * When this query is added ($and) to an existing query,
 * it should ensure an empty result
 */
export const EmptyResultQuery = { $and: [{ _id: false }] };
