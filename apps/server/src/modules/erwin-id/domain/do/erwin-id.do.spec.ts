import { EntityId } from '@shared/domain/types';
import { ErwinIdReferencedEntityType } from '../../types';
import { ErwinId } from './erwin-id.do';

describe(ErwinId.name, () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		describe('When constructor is called with required properties', () => {
			const setup = () => {
				const props = {
					id: 'erwin-id-1',
					erwinId: 'E123456',
					type: ErwinIdReferencedEntityType.USER,
					erwinIdReferencedEntityId: 'entity-789' as EntityId,
				};

				const domainObject = new ErwinId(props);

				return { domainObject };
			};

			it('should create an ErwinId domain object', () => {
				const { domainObject } = setup();

				expect(domainObject instanceof ErwinId).toEqual(true);
			});
		});

		describe('When constructor is called with a valid erwinId', () => {
			const setup = () => {
				const props = {
					id: 'erwin-id-2',
					erwinId: 'E654321',
					type: ErwinIdReferencedEntityType.USER,
					erwinIdReferencedEntityId: 'entity-456' as EntityId,
				};

				const erwinIdDo = new ErwinId(props);

				return { props, erwinIdDo };
			};

			it('should set the erwinId on the domain object', () => {
				const { props, erwinIdDo } = setup();

				expect(erwinIdDo.erwinId).toEqual(props.erwinId);
			});
		});
	});

	describe('getters', () => {
		describe('When getters are used on a created ErwinId', () => {
			const setup = () => {
				const props = {
					id: 'erwin-id-3',
					erwinId: 'E789123',
					type: ErwinIdReferencedEntityType.USER,
					erwinIdReferencedEntityId: 'entity-123' as EntityId,
				};

				const erwinIdDo = new ErwinId(props);

				return { props, erwinIdDo };
			};

			it('should return the values from the underlying props', () => {
				const { props, erwinIdDo } = setup();

				const getterValues = {
					erwinId: erwinIdDo.erwinId,
					type: erwinIdDo.type,
					erwinIdReferencedEntityId: erwinIdDo.erwinIdReferencedEntityId,
				};

				const expectedValues = {
					erwinId: props.erwinId,
					type: props.type,
					erwinIdReferencedEntityId: props.erwinIdReferencedEntityId,
				};

				expect(getterValues).toEqual(expectedValues);
			});
		});
	});
});
