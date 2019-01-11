'use strict';

const chai = require('chai');
const expect = chai.expect;

const app = require('../../../src/app');
const { ifSuperhero, getSessionUser } = require('../../../src/services/teams/hooks/helpers');
const { setupUser, deleteUser, getRoleByKey, MockEmailService } = require('./helper/helper.user');
const { h1, h2, h3 } = require('./helper/helper.format');
const { isPromise } = require('./helper/helper.main');
const { createHook, createHookStack } = require('./helper/helper.hook');

describe(h1('teams | helper functions'), () => {
    let server,
        student, student2, teacher, administrator, expert, superhero;

    //I) init server
    before((done) => {
        server = app.listen(0, done);
    });

    //II) init users
    before(async () => {
        [student, student2, teacher, administrator, expert, superhero] = await Promise.all([
            setupUser('student'),
            setupUser('student'),
            setupUser('teacher'),
            setupUser('administrator'),
            setupUser('expert'),
            setupUser('superhero'),        
        ]);
    });

    after(async () => {
        await Promise.all([
            deleteUser(student),
            deleteUser(student2),
            deleteUser(teacher),
            deleteUser(administrator),
            deleteUser(expert),
            deleteUser(superhero),        
        ]);
        await server.close();
    });

    describe(h2('ifSuperhero'), async () => {
        let superheroRoles, otherRoles;
        before(async () => {
            [superheroRoles, otherRoles] = await Promise.all([
                getRoleByKey('_id', superhero.user.roles[0]), 
                getRoleByKey('_id', student.user.roles[0]),
            ]);
        });

        it(h3('superhero'), () => {
            expect(ifSuperhero([superheroRoles])).to.equal(true);
        });

        it(h3('other roles'), () => {
            expect(ifSuperhero([otherRoles])).to.equal(false);
        });

        it(h3('mixed roles with superhero'), () => {
            expect(ifSuperhero([otherRoles, superheroRoles])).to.equal(true);
        });

        it(h3('mixed roles without superhero'), () => {
            expect(ifSuperhero([otherRoles, superheroRoles])).to.equal(true);
        });
    });

    describe(h2('getSessionUser'), async () => {
        let hooks, superheroHook;
        before(()=>{
            hooks = createHookStack(app,{
                data:{},
                result:{},
                account:student.account
            });

            superheroHook = createHook({
                account:superhero.account
            });
        });

        it(h3('return is promise'),()=>{
            const expectedPromise = getSessionUser(hooks.before.get);
            expect(isPromise(expectedPromise)).to.equal(true);     
        });

        it(h3('save user into hook'),async()=>{
            let tempHook = Object.assign({},hooks.before.get);
            await getSessionUser(tempHook);
            expect(tempHook.additionalInfosTeam.sessionUser).to.deep.equal(student.user);       //todo load from scope file export
        });
    });
    
});
