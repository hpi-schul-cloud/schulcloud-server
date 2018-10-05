'use strict';

const auth = require('feathers-authentication');
//const hooks       = require('feathers-hooks');
const errors = require('feathers-errors');
//const logger      = require('winston');
const globalHooks = require('../../../hooks');

const roles={
    teammember:'5bb5c190fb457b1c3c0c7e0f',
    teamexpert:'5bb5c391fb457b1c3c0c7e10',
    teamleader:'5bb5c49efb457b1c3c0c7e11',
    teamadministrator:'5bb5c545fb457b1c3c0c7e13',
    teamowner :'5bb5c62bfb457b1c3c0c7e14'
}

/** !!!todo: update for teams!!! **/

/**
 * adds all students to a course when a class is added to the course
 * @param hook - contains created/patched object and request body
 */
const addWholeClassToCourse = (hook) => {
    let requestBody = hook.data;
    let course = hook.result;
    if ((requestBody.classIds || []).length > 0) { // just courses do have a property "classIds"
        return Promise.all(requestBody.classIds.map(classId => {
            return ClassModel.findById(classId).exec().then(c => c.userIds);
        })).then(studentIds => {
            // flatten deep arrays and remove duplicates
            studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

            // add all students of classes to course, if not already added
            return Promise.all(studentIds.map(s => {
                if (!_.some(course.userIds, u => JSON.stringify(u) === JSON.stringify(s))) {
                    return CourseModel.update({ _id: course._id }, { $push: { userIds: s } }).exec();
                } else {
                    return {};
                }
            })).then(_ => hook);
        });
    } else {
        return hook;
    }
};


/** !!!todo: update for teams!!! **/

/**
 * deletes all students from a course when a class is removed from the course
 * this function goes into a before hook before we have to check whether there is a class missing
 * in the patch-body which was in the course before
 * @param hook - contains and request body
 */
const deleteWholeClassFromCourse = (hook) => {
    let requestBody = hook.data;
    let courseId = hook.id;
    return CourseModel.findById(courseId).exec().then(course => {
        if (!course) return hook;

        let removedClasses = _.differenceBy(course.classIds, requestBody.classIds, (v) => JSON.stringify(v));
        if (removedClasses.length < 1) return hook;
        return Promise.all(removedClasses.map(classId => {
            return ClassModel.findById(classId).exec().then(c => (c || []).userIds);
        })).then(studentIds => {
            // flatten deep arrays and remove duplicates
            studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

            // remove all students of classes from course, if they are in course
            return Promise.all(studentIds.map(s => {
                if (!_.some(course.userIds, u => JSON.stringify(u) === JSON.stringify(s))) {
                    return CourseModel.update({ _id: course._id }, { $pull: { userIds: s } }).exec();
                } else {
                    return {};
                }
            })).then(result => {

                // also remove all students from request body for not reading them in after hook
                requestBody.userIds = _.differenceBy(requestBody.userIds, studentIds, (v) => JSON.stringify(v));
                hook.data = requestBody;
                return hook;
            });
        });
    });
};

const extract = (res) => {
    if (res.data.length == 1) {
        return res.data[0]
    } else {
        throw new errors.BadRequest('Bad intern call. (1)');
    }
}

const restrictToCurrentSchoolAndUser = globalHooks.ifNotLocal(hook => {
    const id     = hook.id;
    const method = hook.method;
    const userId = hook.params.account.userId;

    //get user
    const usersService = hook.app.service('users');
    const waitUser     = usersService.find({
        query: {
            _id: hook.params.account.userId,
            $populate: 'roles'
        }
    }).then(res => {
        const r=res;
        return extract(res);
    }).catch(err => {
        throw new errors.BadRequest('User can not found.');
    })

    //get team 
    const teamsService = hook.app.service('teams');
    const waitTeams = new Promise((resolve, reject) => {
        if (method === 'create' && id === undefined) {

            //set owner
            const index = hook.data.userIds.indexOf(userId);
            const value = {[userId]:roles.teamowner};
            if(index==-1){
                hook.data.userIds.push(value);      //add owner
            }else{
                hook.data.userIds[index]=value;     //replace with tuple
            } 

            resolve();       //team do not exist
        } else if (method === 'find' && id === undefined) {
            //return course ids

            //todo: what ever

        } else if (id) {
            teamsService.get(id).then(res => {
                resolve(extract(res));
            }).catch(err => {
                reject();
                throw new errors.BadRequest('Wrong input.');
            });
        }
    });

    return Promise.all([waitUser, waitTeams]).then( data => {
        //const inputSchoolId = (hook.data||{}).schoolId || (hook.params.query||{}).schoolId;
        const user = data[0];
        const team = data[1];
        if (data.length!=2 || user === undefined) {
            throw new errors.BadRequest('Bad intern call. (2)');
        }
        const schoolId = user.schoolId.toString();  //take from user db
        

        if (schoolId === undefined) {
            throw new errors.BadRequest('User has no school.');
        }
        /*
        let access = false;
        //superhero can pass it
        user.roles.map(role => {
            if (role.name === 'superhero') {
                access = true;
            }
        });

        if (access) {
            return Promise.resolve(hook);
        } */

        if (team !== undefined && method !== 'create') {
            //test if asked school in team
            if (team.schoolIds.include(schoolId) === false) {
                throw new errors.Forbidden('You do not have valid permissions to access this.(1)');
            }

            //test if user in team
            if (Object.values(team.userIds).include(user._id) === false) {
                throw new errors.Forbidden('You do not have valid permissions to access this.(2)');
            }
        }

        //add current schoolId to hook
        //todo: maybe schoolId can pass in every case to hook.data.schoolId 
        //todo2: maybe it work better to create test if is already set and rejected, after it set one time
        if (method == "get" || method == "find") {                  //by find and get use query to pass additional data
            if (hook.params.query.schoolId == undefined) {          //should undefined
                hook.params.query.schoolId = schoolId;
            } else if (hook.params.query.schoolId != schoolId) {
                throw new errors.Forbidden('You do not have valid permissions to access this.(3)');
            }
        } else {                                                     //for any other methode add it do data
            if (hook.data.schoolIds == undefined) {                   //should undefined
                hook.data.schoolIds = [schoolId];                     //need array 
            } else if (hook.data.schoolId != schoolId) {              //account schoolId === send schoolId
                throw new errors.Forbidden('You do not have valid permissions to access this.(4)');
            }
        }  

        //move to additonal hook?
        //map userIds to {userId:teamRoleId} tupel
        if(hook.data.userIds!==undefined && hook.data.userIds.length>0){
             hook.data.userIds=hook.data.userIds.map((item)=>{
                 if(typeof item === 'string'){                      //if userId has no role, it should map to member
                    return {[item]:roles.teammember}
                }else if(typeof item === 'object'){
                    return item
                 }
            });
        }
        const h=hook;
        return Promise.resolve(hook);
    })
});

const existId = (hook) => {
    if (['find', 'create'].includes(hook.method)) {
        return Promise.resolve(hook);
    } else if (!hook.id) {
        throw new errors.Forbidden('Operation on this service requires an id!');
    } else {
        return Promise.resolve(hook);
    }
};

const testInputForCreate=hook=>{
    const data=hook.data;
    
    return hook
}


//todo: TeamPermissions
exports.before = {
    all: [auth.hooks.authenticate('jwt'), existId, restrictToCurrentSchoolAndUser],
    find: [],
    get: [],                                //no course restriction becouse circle request in restrictToCurrentSchoolAndUser (?)
    create: [globalHooks.injectUserId,testInputForCreate],
    update: [],
    patch: [deleteWholeClassFromCourse],
    remove: []
};

//todo:clear unused values 
//todo: update moongose 
exports.after = {
    all: [],
    find: [],
    get: [],                                 //see before (?)
    create: [addWholeClassToCourse],
    update: [],                             //test schoolId remove
    patch: [addWholeClassToCourse],         //test schoolId remove
    remove: []
};
