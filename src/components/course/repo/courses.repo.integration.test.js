const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const coursesRepo = require('./courses.repo');
const { NotFound } = require('../../../errors');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('when...', () => {
	it('should...', () => {});
});
