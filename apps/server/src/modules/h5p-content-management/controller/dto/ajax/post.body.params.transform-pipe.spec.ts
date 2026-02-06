/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as Validation from 'class-validator';
import {
	AjaxPostBodyParams,
	ContentBodyParams,
	LibrariesBodyParams,
	LibraryParametersBodyParams,
} from './post.body.params';
import { AjaxPostBodyParamsTransformPipe } from './post.body.params.transform-pipe';

jest.mock('class-validator', () => {
	return {
		...jest.requireActual('class-validator'),
		validate: jest.fn().mockResolvedValue([]),
	};
});

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

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [AjaxPostBodyParamsTransformPipe],
		}).compile();
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

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
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
	it('when value contains no valid data', async () => {
		const result = await ajaxBodyTransformPipe.transform({
			someInvalidValue: 'invalid',
		} as unknown as AjaxPostBodyParams);
		expect(result).toBeUndefined();
	});
	it('when validationResult.length > 0', async () => {
		const validationErrors = [
			{ property: 'test', constraints: { isNotEmpty: 'should not be empty' } },
		] as Validation.ValidationError[];
		jest.spyOn(Validation, 'validate').mockResolvedValueOnce(validationErrors);

		const mockExceptionFactory = jest.fn(() => new Error('Validation failed'));
		const mockValidationPipe = {
			createExceptionFactory: jest.fn(() => mockExceptionFactory),
		};
		(ValidationPipe as jest.Mock).mockImplementationOnce(() => mockValidationPipe);

		await expect(ajaxBodyTransformPipe.transform(emptyAjaxPostBodyParams3)).rejects.toThrow('Validation failed');
		expect(ValidationPipe).toHaveBeenCalled();
		expect(mockValidationPipe.createExceptionFactory).toHaveBeenCalled();
		expect(mockExceptionFactory).toHaveBeenCalledWith(validationErrors);
	});

	it('when validationResult.length === 0 (validation passes)', async () => {
		jest.spyOn(Validation, 'validate').mockResolvedValueOnce([]);

		const result = await ajaxBodyTransformPipe.transform(emptyAjaxPostBodyParams1);

		expect(result).toBeDefined();
		expect(result).toEqual(emptyAjaxPostBodyParams1);
		expect(ValidationPipe).not.toHaveBeenCalled();
	});
});
