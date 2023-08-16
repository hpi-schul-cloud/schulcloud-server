import { FilePermission } from './file-permission.do';
import { FilePermissionReferenceModel } from './types';

describe(FilePermission.name, () => {
	it('getters should return proper values from the props passed via constructor', () => {
		const props = {
			referenceId: 'b2b8b500-7236-4c8e-9009-30bc4fc471bf',
			referenceModel: FilePermissionReferenceModel.USER,
			readPermission: true,
			writePermission: true,
			createPermission: true,
			deletePermission: true,
		};

		const filePermission = new FilePermission(props);

		const gettersValues = {
			referenceId: filePermission.referenceId,
			referenceModel: filePermission.referenceModel,
			readPermission: filePermission.readPermission,
			writePermission: filePermission.writePermission,
			createPermission: filePermission.createPermission,
			deletePermission: filePermission.deletePermission,
		};

		expect(gettersValues).toEqual(props);
	});
});
