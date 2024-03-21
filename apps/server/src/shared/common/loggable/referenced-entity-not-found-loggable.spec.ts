import { ObjectId } from '@mikro-orm/mongodb';
import { ReferencedEntityNotFoundLoggable } from './referenced-entity-not-found-loggable';
import { EntityId } from '../../domain/types';

describe(ReferencedEntityNotFoundLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const sourceEntityName = 'sourceEntityName';
			const sourceEntityId: EntityId = new ObjectId().toHexString();
			const referencedEntityName = 'referencedEntityName';
			const referencedEntityId: EntityId = new ObjectId().toHexString();

			const loggable: ReferencedEntityNotFoundLoggable = new ReferencedEntityNotFoundLoggable(
				sourceEntityName,
				sourceEntityId,
				referencedEntityName,
				referencedEntityId
			);

			return {
				loggable,
				referencedEntityName,
				referencedEntityId,
				sourceEntityName,
				sourceEntityId,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, referencedEntityName, referencedEntityId, sourceEntityName, sourceEntityId } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message: 'The requested entity could not been found, but it is still referenced.',
				data: {
					referencedEntityName,
					referencedEntityId,
					sourceEntityName,
					sourceEntityId,
				},
			});
		});
	});
});
