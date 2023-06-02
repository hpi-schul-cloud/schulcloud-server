import { H5PAjaxEndpoint, H5PEditor } from '@lumieducation/h5p-server';
import { H5PEditorService } from './h5p-editor.service';

export const H5PAjaxEndpointService = {
	provide: H5PAjaxEndpoint,
	inject: [H5PEditorService],
	useFactory: (h5pEditor: H5PEditor) => {
		const h5pAjaxEndpoint = new H5PAjaxEndpoint(h5pEditor);

		return h5pAjaxEndpoint;
	},
};
