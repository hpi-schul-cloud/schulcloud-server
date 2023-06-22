import { H5PAjaxEndpoint, H5PEditor } from '@lumieducation/h5p-server';

export const H5PAjaxEndpointService = {
	provide: H5PAjaxEndpoint,
	inject: [H5PEditor],
	useFactory: (h5pEditor: H5PEditor) => {
		const h5pAjaxEndpoint = new H5PAjaxEndpoint(h5pEditor);

		return h5pAjaxEndpoint;
	},
};
