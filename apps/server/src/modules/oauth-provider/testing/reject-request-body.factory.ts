import { Factory } from 'fishery';
import { RejectRequestBody } from '../domain/interface';

export const rejectRequestBodyFactory = Factory.define<RejectRequestBody>(() => {
	return {
		error: 'error',
		error_debug: '',
		error_description: '',
		error_hint: '',
		status_code: 500,
	};
});
