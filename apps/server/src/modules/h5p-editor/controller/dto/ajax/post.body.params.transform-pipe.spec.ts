/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	AjaxPostBodyParams,
	ContentBodyParams,
	LibrariesBodyParams,
	LibraryParametersBodyParams,
} from './post.body.params';
import { AjaxPostBodyParamsTransformPipe } from './post.body.params.transform-pipe';

jest.mock('@nestjs/common', () => {
	return {
		...jest.requireActual('@nestjs/common'),
		ValidationPipe: jest.fn().mockImplementation(() => {
			return {
				transform: jest.fn(),
				createExceptionFactory: jest.fn(() => jest.fn(() => new Error('Mocked Error'))),
			};
		}),
	};
});

describe('transform', () => {
	let ajaxBodyTransformPipe: AjaxPostBodyParamsTransformPipe;
	let emptyAjaxPostBodyParams1: AjaxPostBodyParams;
	let emptyAjaxPostBodyParams2: AjaxPostBodyParams;
	let emptyAjaxPostBodyParams3: AjaxPostBodyParams;
	let emptyAjaxPostBodyParams4: AjaxPostBodyParams;

	let module: TestingModule;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let validationPipe: ValidationPipe;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [AjaxPostBodyParamsTransformPipe, ValidationPipe],
		}).compile();
		validationPipe = module.get(ValidationPipe);
		ajaxBodyTransformPipe = module.get(AjaxPostBodyParamsTransformPipe);

		const emptyLibrariesBodyParams: LibrariesBodyParams = {
			libraries: [],
		};

		const emptyLibraryParametersBodyParams: LibraryParametersBodyParams = {
			libraryParameters: '',
		};

		const emptyContentBodyParams: ContentBodyParams = {
			contentId: '',
			field: '',
		};

		emptyAjaxPostBodyParams1 = emptyLibrariesBodyParams;
		emptyAjaxPostBodyParams2 = emptyContentBodyParams;
		emptyAjaxPostBodyParams3 = emptyLibraryParametersBodyParams;
		emptyAjaxPostBodyParams4 = undefined;
	});

	it('when libaries in value', async () => {
		const result = await ajaxBodyTransformPipe.transform(emptyAjaxPostBodyParams1);
		expect(result).toBeDefined();
	});

	it('when contentId in value', async () => {
		const result = await ajaxBodyTransformPipe.transform(emptyAjaxPostBodyParams2);
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
