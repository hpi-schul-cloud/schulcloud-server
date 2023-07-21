import { setupEntities } from '@shared/testing';
import { externalToolPseudonymEntityFactory } from '@shared/testing/factory/external-tool-pseudonym.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolPseudonymEntity } from './external-tool-pseudonym.entity';

describe('ExternalToolPseudonymEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when constructor has no parameters', () => {
			it('should throw an error', () => {
				// @ts-expect-error: Test case
				const test = () => new ExternalToolPseudonymEntity();
				expect(test).toThrow();
			});
		});

		describe('when constructor has all required parameters', () => {
			it('should pass', () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.build();

				expect(entity instanceof ExternalToolPseudonymEntity).toEqual(true);
			});
		});

		describe('when passed undefined id', () => {
			const setup = () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.build();

				return { entity };
			};

			it('should not set the id', () => {
				const { entity } = setup();

				const externalToolPseudonymEntity: ExternalToolPseudonymEntity = new ExternalToolPseudonymEntity(entity);

				expect(externalToolPseudonymEntity.id).toBeNull();
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const entity: ExternalToolPseudonymEntity = externalToolPseudonymEntityFactory.build({
					id: new ObjectId().toHexString(),
				});

				return { entity };
			};

			it('should set the id', () => {
				const { entity } = setup();

				const externalToolPseudonymEntity: ExternalToolPseudonymEntity = new ExternalToolPseudonymEntity(entity);

				expect(externalToolPseudonymEntity.id).toEqual(entity.id);
			});
		});
	});
});
