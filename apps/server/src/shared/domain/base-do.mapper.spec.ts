describe('base-do.mapper', () => {
	describe('when one entity resolve in one domain object', () => {});
	describe('when one entity resolve in multiple domain objects', () => {});
	describe.skip('when multiple entities resolve in one domain object', () => {});
	describe('when one generic object resolve in one domain object', () => {}); // todo allow as type
	describe.skip('when one generic object and entity resolve in one domain object', () => {});
	//---
	describe('when keys from domainObject are different to entity', () => {});
	describe.skip('when keys from domainObject are missed by mapping', () => {});
	describe('when embedded objects with id must be merged', () => {}); // todo check how complicated it is
	describe('when arrays must be merged into entites', () => {}); // todo add helper
	describe('when arrays that include embedded objects with id must be merged', () => {}); // todo add helper
});
