import { FilePermission } from './file-permission.do';
import { FilePermissionReferenceModel } from './types';

describe(FilePermission.name, () => {
	const setup = () => {
		const props = {
			referenceId: 'b2b8b500-7236-4c8e-9009-30bc4fc471bf',
			referenceModel: FilePermissionReferenceModel.USER,
			readPermission: true,
			writePermission: true,
			createPermission: true,
			deletePermission: true,
		};

		const domainObject = new FilePermission(props);

		return { props, domainObject };
	};

	describe('getProps', () => {
		it('should return proper copy of the props object', () => {
			const { props, domainObject } = setup();

			const doProps = domainObject.getProps();

			expect(doProps).toEqual(props);

			// Verify if the returned props object is an actual
			// (deep) copy and not just the original props object.
			expect(doProps === props).toEqual(false);
		});
	});

	describe('getters', () => {
		it('getters should return proper values from the props passed via constructor', () => {
			const { props, domainObject } = setup();

			const gettersValues = {
				referenceId: domainObject.referenceId,
				referenceModel: domainObject.referenceModel,
				readPermission: domainObject.readPermission,
				writePermission: domainObject.writePermission,
				createPermission: domainObject.createPermission,
				deletePermission: domainObject.deletePermission,
			};

			expect(gettersValues).toEqual(props);
		});
	});
});
