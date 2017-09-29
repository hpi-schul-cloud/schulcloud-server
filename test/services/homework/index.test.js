'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');
const homeworkService = app.service('homework');
const expect = chai.expect;


describe('homework service', function() {
    this.timeout(10000);
    
    it('registered the homework service', () => {
        assert.ok(app.service('homework'));
    });

    const testAufgabe = {
        schoolId: "0000d186816abba584714c5f",
        teacherId: "0000d231816abba584714c9e",
        name: "Testaufgabe",
        description: "\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n",
        availableDate: "2017-09-28T11:47:46.622Z",
        dueDate: "2030-11-16T12:47:00.000Z",
        private: true,
        archived: ["0000d231816abba584714c9e"],
        lessonId: null,
        courseId: null,
        updatedAt: "2017-09-28T11:47:46.648Z",
        createdAt: "2017-09-28T11:47:46.648Z"
    };
    it("CREATE task", () => {
        homeworkService.create(testAufgabe)
			.then(result => {
                expect(result.name).to.equal("Testaufgabe");
			});
    });
    it("DELETE task", () => {
        return homeworkService.find({
            query: {name: 'Testaufgabe'},
            account: {userId: '0000d231816abba584714c9e'}}).then(result => {
                expect(result.data.length).to.be.above(0);
                return homeworkService.remove(result.data[0]._id)
                .then(result => {
                    return true;
                });
            });
    });

    // PERMISSION TESTS
    it('FIND only my own tasks', () => {
		return homeworkService.find({
			query: {},
			account: {userId: '0000d231816abba584714c9e'}}).then(result => {
                expect(result.total).to.be.above(0);
                expect(result.data.filter(e => {return e.teacherId != "0000d231816abba584714c9e";}).length).to.equal(0);
			});
	});

    it('try to FIND tasks of others', () => {
		return homeworkService.find({
			query: {teacherId: "0000d224816abba584714c9c"},
			account: {userId: '0000d231816abba584714c9e'}}).then(result => {
                expect(result.total).to.equal(0);
			});
	});

    it('contains statistics as a teacher', () => {
		return homeworkService.find({
			query: {_id: "59cce3f6c6abf042248e888d"},
			account: {userId: '0000d231816abba584714c9e'}}).then(result => {
                expect(result.data[0].stats.userCount).to.equal(2);
                expect(result.data[0].stats.submissionCount).to.equal(0);
                expect(result.data[0].stats.submissionPercentage).to.equal(undefined);
                expect(result.data[0].stats.gradeCount).to.equal(0);
                expect(result.data[0].stats.gradePercentage).to.equal(undefined);
                expect(result.data[0].stats.averageGrade).to.equal(undefined);
                // no grade as a teacher
                expect(result.data[0].grade).to.equal(undefined);
			});
	});
    it('contains grade as a student', () => {
		return homeworkService.find({
			query: {_id: "59cce3f6c6abf042248e888d"},
			account: {userId: '0000d224816abba584714c9c'}}).then(result => {
                expect(result.data[0].grade).to.not.equal(undefined);
                // no stats as a student
                //expect(result.data[0].stats).to.equal(undefined);
			});
	});



    /*
    it('GET my private task', () => {
        return homeworkService.get('59cce4ebc6abf042248e888f').then(data => {
			assert(data._id == '59cce4ebc6abf042248e888f');
		});
    });

    it('GET others private task', () => {
        return homeworkService.get('59cce4ebc6abf042248e888f').then(data => {
			throw new Error('was not supposed to succeed');
		}).catch(err => {
			assert(true);
		});
    });
    */
});
