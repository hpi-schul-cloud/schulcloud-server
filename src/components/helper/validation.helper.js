const _ = require('lodash');
const { AssertionError } = require('../../errors');
const {
	missingParameters,
	requiredParametersToBeNonEmtyString,
	requiredParametersShouldMatchEmailRegex,
} = require('../../errors/assertionErrorHelper');

const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;
const constants = require('../../utils/constants');

/* Plain validators resoving with bool */

const isNullOrUndefined = (value) => value === null || value === undefined;

const isValidEmailString = (email) => constants.expressions.email.test(email);

const isStringAndNotEmpty = (prop) => typeof prop === 'string' && prop.length > 0;

/* HELPERS */

/**
 * Takes props from an object to be validated against a validator function.
 * All property names that did not pass the validator function will be returned.
 * @param {*} objectOfProperties
 * @param {*} validatorFn resolving with a boolean
 */
const validateProps = (objectOfProperties, validatorFn) => {
	const invalidProps = {};
	for (const prop in objectOfProperties) {
		if (validatorFn(objectOfProperties[prop]) !== true) {
			invalidProps[prop] = objectOfProperties[prop];
		}
	}
	return invalidProps;
};
/**
 * Throw an AssertionError with the given helper when invalidProps is not an empty Object and contains properties.
 * The given properties will be included in assertion error details.
 * @param {*} invalidProps
 * @param {*} assertionErrorHelper
 */
const eventuallyThrow = (invalidProps = {}, assertionErrorHelper) => {
	if (!_.isEmpty(invalidProps)) {
		throw new AssertionError(assertionErrorHelper({ ...invalidProps }));
	}
};

/*
 * Error throwing validators
 * They should accept multiple properties given within of one single object, which allows keeping property names given.
 * The property names should be added in the assertion error helper.
 */

const validateObjectId = ({ ...objectId }) => {
	const invalidProps = validateProps(objectId, isValidObjectId);
	eventuallyThrow(invalidProps, missingParameters);
};

const validateNotNullOrUndefined = ({ ...values }) => {
	const invalidProps = validateProps(values, isNullOrUndefined);
	eventuallyThrow(invalidProps, missingParameters);
};

const validateNotEmptyString = ({ ...values }) => {
	const invalidProps = validateProps(values, isStringAndNotEmpty);
	eventuallyThrow(invalidProps, requiredParametersToBeNonEmtyString);
};

const validateEmail = ({ ...emails }) => {
	const invalidProps = validateProps(emails, isValidEmailString);
	eventuallyThrow(invalidProps, requiredParametersShouldMatchEmailRegex);
};

module.exports = {
	validateObjectId,
	validateEmail,
	validateNotNullOrUndefined,
	validateNotEmptyString,
};
