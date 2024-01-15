import { Factory } from 'fishery';
import { AcceptLoginRequestBody } from '../domain/interface';

export const acceptLoginRequestBodyFactory = Factory.define<AcceptLoginRequestBody>(() => {
	return {
		amr: [],
		acr: '',
		context: {},
		force_subject_identifier: '',
		remember: true,
		subject: '',
		remember_for: 0,
	};
});
