import { EntityId } from '@shared/domain/types';
import { ReferencedEntityType } from '../../types';
import { ErwinIdentifier } from './erwin-identifier.do';

describe(ErwinIdentifier.name, () => {
	describe('constructor', () => {
		describe('when constructor is called with required properties', () => {
			const setup = () => {
				const props = {
					id: 'erwin-id-1',
					erwinId: 'E123456',
					type: ReferencedEntityType.USER,
					referencedEntityId: 'entity-789' as EntityId,
				};

				const domainObject = new ErwinIdentifier(props);

				return { props, domainObject };
			};

			it('should create an erwinIdentifier domain object', () => {
				const { domainObject } = setup();

				expect(domainObject instanceof ErwinIdentifier).toEqual(true);
			});

			it('should set the id on the erwinIdentifier domain object', () => {
				const { props, domainObject } = setup();

				expect(domainObject.id).toEqual(props.id);
			});
		});
	});

	describe('getters', () => {
		describe('when getters are used on a created ErwinIdentifier', () => {
			const setup = () => {
				const props = {
					id: 'erwin-id-2',
					erwinId: 'E789123',
					type: ReferencedEntityType.SCHOOL,
					referencedEntityId: 'entity-123' as EntityId,
				};

				const domainObject = new ErwinIdentifier(props);

				return { props, domainObject };
			};

			it('should return the values from the underlying props', () => {
				const { props, domainObject } = setup();

				const getterValues = {
					erwinId: domainObject.erwinId,
					type: domainObject.type,
					referencedEntityId: domainObject.referencedEntityId,
				};

				const expectedValues = {
					erwinId: props.erwinId,
					type: props.type,
					referencedEntityId: props.referencedEntityId,
				};

				expect(getterValues).toEqual(expectedValues);
			});
		});
	});
});
