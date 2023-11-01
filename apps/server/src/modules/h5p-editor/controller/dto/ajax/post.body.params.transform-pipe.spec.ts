import { AjaxPostBodyParams, LibrariesBodyParams, LibraryParametersBodyParams } from './post.body.params';
import { AjaxPostBodyParamsTransformPipe } from './post.body.params.transform-pipe';

describe('transform', () => {
	let ajaxBodyTransformPipe: AjaxPostBodyParamsTransformPipe;
	let emptyAjaxPostBodyParams1: AjaxPostBodyParams;
	//	let emptyAjaxPostBodyParams2: AjaxPostBodyParams;
	let emptyAjaxPostBodyParams3: AjaxPostBodyParams;
	let emptyAjaxPostBodyParams4: AjaxPostBodyParams;

	beforeAll(() => {
		ajaxBodyTransformPipe = new AjaxPostBodyParamsTransformPipe();

		const emptyLibrariesBodyParams: LibrariesBodyParams = {
			libraries: [],
		};

		const emptyLibraryParametersBodyParams: LibraryParametersBodyParams = {
			libraryParameters: '',
		};

		emptyAjaxPostBodyParams1 = emptyLibrariesBodyParams;
		emptyAjaxPostBodyParams3 = emptyLibraryParametersBodyParams;
		emptyAjaxPostBodyParams4 = undefined;
	});

	it('when libaries in value', async () => {
		const result = await ajaxBodyTransformPipe.transform(emptyAjaxPostBodyParams1);
		expect(result).toBeDefined();
	});

	it('when libaryParameters in value', async () => {
		const result = await ajaxBodyTransformPipe.transform(emptyAjaxPostBodyParams3);
		expect(result).toBeDefined();
	});

	it('when not libaries | contentId | libaryParameters in value', async () => {
		const result = await ajaxBodyTransformPipe.transform(emptyAjaxPostBodyParams4);
		expect(result).toBeUndefined();
	});
});
