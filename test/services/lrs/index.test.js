'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');
const lrsService = app.service('lrs');
const expect = chai.expect;

describe('lrs service', function() {
	this.timeout(10000);

	const testStatements = [{
		"actor": {
			"account": {
				"homePage": "https://bp.schul-cloud.org/",
				"name": "59ad4c412b442b7f81810285"
			},
			"objectType": "Agent"
		},
		"verb": {
			"id": "http://adlnet.gov/expapi/verbs/experienced",
			"display": {
				"en-US": "experienced"
			}
		},
		"object": {
			"id": "https://acc.bettermarks.com/app/teacher.html#/open-worksheet/bookId%252F4bddcd_DE_schulcloud_de%252FsubchapterId%252F4bddcd_DE_schulcloud_de_b6e75e%252FcontentListRef%252FGeoIIGLWH_LOB01_exl_bm_de%252FgroupId%252Fundefined%252FexerciseStartMode%252Fstart%252FexerciseType%252Fbook%252FcontentLocale%252Fde_DE%252Freporting%252Ftrue%252FseriesRedo%252Ftrue%252FseriesId%252F697791438246642305",
			"definition": {
				"name": {
					"id": "0239480",
					"de": "bettermarks Winkelhalbierende"
				},
				"description": {
					"de": "Aufgabe"
				}
			},
			"objectType": "Activity"
		},

		"context": {
			"contextActivities": {
				"parent":
					{
						"id": "https://bp.schul-cloud.org/courses/5a79c9fa3c50db0010e0fcd4"
					}
			}
		}
	}];

	it('is registered', () => {
		assert.ok(app.service('lrs'));
	});

	let statements = [];
	it("creates statements on CREATE", () => {
		return lrsService.create(testStatements).then(result => {
			statements = result;
			expect(statements).to.be.a('Array');
			expect(statements).to.have.length(1);
		});
	});


	it("returns all statements on FIND without params", () => {
		return lrsService.find().then(result => {
			expect(result.statements).to.be.a('Array');
		});
	});


});
