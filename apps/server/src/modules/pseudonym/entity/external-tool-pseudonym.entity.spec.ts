import { setupEntities } from '@shared/testing';
import { externalToolPseudonymEntityFactory } from '@shared/testing/factory/external-tool-pseudonym.factory';
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
	});
});
