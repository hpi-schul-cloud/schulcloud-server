import { ObjectId } from 'bson';
import { ReferencedEntityNotFoundLoggable } from './referenced-entity-not-found-loggable';

describe(ReferencedEntityNotFoundLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const referencedId: string = new ObjectId().toHexString();
			const sourceEntityName = 'entityName';
			const sourceId: string = new ObjectId().toHexString();

			const loggable: ReferencedEntityNotFoundLoggable = new ReferencedEntityNotFoundLoggable(
				referencedId,
				sourceEntityName,
				sourceId
			);

			return {
				loggable,
				referencedId,
				sourceEntityName,
				sourceId,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, referencedId, sourceEntityName, sourceId } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message: 'The requested entity could not been found, but it is still referenced.',
				data: {
					userId: referencedId,
					entityName: sourceEntityName,
					entityId: sourceId,
				},
			});
		});
	});
});
