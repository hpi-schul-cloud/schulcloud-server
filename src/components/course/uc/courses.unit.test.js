const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const couresUC = require('./courses.uc');

const { coursesRepo } = require('../repo/index');

const { expect } = chai;
chai.use(chaiAsPromised);
