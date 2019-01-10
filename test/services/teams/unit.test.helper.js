'use strict';

const chai = require('chai');
const expect = chai.expect;

const app = require('../../../src/app');
const { ifSuperhero, getSessionUser } = require('../../../src/services/teams/hooks/helpers');
const { setupUser, deleteUser, getRoleByKey, MockEmailService } = require('./helper/helper.test');
const { h1, h2, h3 } = require('./helper/helper.format');
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
        let hooks;
        before(()=>{
            hooks = createHookStack({
                data:{},
                result:{}
            });
        });
        
        it(h3('try'),()=>{
            console.log(hooks);
            
        });
    });
    
});
