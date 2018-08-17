const errors = require('feathers-errors');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const consentModel = require('../consent/model');
const globalHooks = require('../../hooks');

const registerStudent = function(data, params, app) {
    let parent = null, user = null, account = null, consent = null, consentPromise = null, classPromise = null, schoolPromise = null;
    let pinInput = data["email-pin"];
    let userMail = data["parent-email"] ? data["parent-email"] : data["student-email"];
    let passwort = data["initial-password"];
    let dateArr = data["student-birthdate"].split(".");
    
    // wrong birthday object?
    let userBirthday = new Date(`${dateArr[1]}.${dateArr[0]}.${dateArr[2]}`);
    if (userBirthday instanceof Date && isNaN(userBirthday)) {
		return Promise.reject("Fehler bei der Erkennung des ausgewählten Geburtstages. Bitte lade die Seite neu und starte erneut.");
	}
	// wrong age?
	let age = globalHooks.getAge(userBirthday);
    if (data["parent-email"] && age >= 18) {
		return Promise.reject(`Schüleralter: ${age} Im Elternregistrierungs-Prozess darf der Schüler nicht 18 Jahre oder älter sein.`);
	} else if (!data["parent-email"] && age < 18) {
		return Promise.reject(`Schüleralter: ${age} Im Schülerregistrierungs-Prozess darf der Schüler nicht jünger als 18 Jahre sein.`);
	}
 	// identical emails?
	if (data["parent-email"] && data["parent-email"] === data["student-email"]) {
		return Promise.reject("Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.");
	}
	
    return app.service('registrationPins').find({
        query: { "pin": pinInput, "email": userMail, verified:false }
    }).then(check => {
        //check pin
        if (!(check.data && check.data.length>0 && check.data[0].pin === pinInput)) {
            return Promise.reject("Ungültige Pin, bitte überprüfe die Eingabe.");
        }
		return Promise.resolve();
    }).then(function () {
        //resolve class or school Id
        classPromise = app.service('classes').find({query: {_id: data.classOrSchoolId}});
        schoolPromise = app.service('schools').find({query: {_id: data.classOrSchoolId}});
        return Promise.all([classPromise, schoolPromise])
            .then(([classes, schools]) => {
                if (classes.total === 1) {
                    data.classId = data.classOrSchoolId;
                    data.schoolId = classes.data[0].schoolId;
                    return Promise.resolve();
                }
                if (schools.total === 1) {
                    data.schoolId = data.classOrSchoolId;
                    return Promise.resolve();
                }
                return Promise.reject("Ungültiger Link");
            })
    }).then(function() {
        //create user
        user = {
            firstName: data["student-firstname"],
            lastName: data["student-secondname"],
            email: data["student-email"],
            gender: data["gender"],
            roles: ["student"],
            schoolId: data.schoolId,
            birthday: userBirthday
        };
        if (data.classId) user.classId = data.classId;
        return app.service('users').create(user, { _additional:{parentEmail:data["parent-email"],asTask:'student'} })	//{query:{parentEmail: data["parent-email"]}}
        .then(newUser => {
            user = newUser;
        })
        .catch(err =>{
            return Promise.reject("Fehler beim Erstellen des Schülers. Eventuell ist die E-Mail-Adresse bereits im System registriert.");
        });
    }).then(() => {
        // create account
        account = {
            username: user.email, 
            password: passwort, 
            userId: user._id, 
            activated: true
        };
        return app.service('accounts').create(account)
            .then(newAccount => {account = newAccount})
            .catch(err => {
            	return Promise.reject(new Error("Fehler beim Erstellen des Schüler-Accounts."));
            });
    }).then(res => {
        //add parent if necessary    
        if(data["parent-email"]) {
            parent = {
                firstName: data["parent-firstname"],
                lastName: data["parent-secondname"],
                email: data["parent-email"],
                children: [user._id],
                schoolId: data.schoolId,
                roles: ["parent"]
            };
            return app.service('users').create(parent, { _additional:{asTask:'parent'} })
            .then(newParent => {
                parent = newParent;
                //add parent to student, because now, we can
                return app.service('users').patch(user._id, {$push: {parents: parent._id }});
            }).catch(err => {
                if (err.message.startsWith("parentCreatePatch")) {
                    return Promise.resolve();
                } else {
                    return Promise.reject(new Error("Fehler beim Erstellen des Elternaccounts."));
                }
            });
        } else {
            return Promise.resolve();
        }
    }).then(function(){
        //store consent
        consent = {
            form: 'digital',
            privacyConsent: data.Erhebung,
            thirdPartyConsent: data.Pseudonymisierung,
            termsOfUseConsent: Boolean(data.Nutzungsbedingungen),
            researchConsent: data.Forschung
        };
        if (parent) {
            consent.parentId = parent._id;
            consentPromise = app.service('consents').create({userId: user._id,parentConsents: [consent]});
        } else {
            consentPromise = app.service('consents').create({userId: user._id, userConsent: consent});
        }
        return consentPromise
            .then(newConsent => {
                consent = newConsent;
                return Promise.resolve();
            }).catch(err => {
                return Promise.reject(new Error("Fehler beim Speichern der Einverständniserklärung."));
            });
    }).then(function() {
        return Promise.resolve({user, parent});
    }).catch(err => {
        //console.log(err);
        let rollbackPromises = [];
        if (user && user._id) {
            rollbackPromises.push(userModel.userModel.findOne({_id: user._id}).remove().exec());
        }
        if (parent && parent._id) {
            rollbackPromises.push(userModel.userModel.findOne({_id: parent._id}).remove().exec());
        }
        if (account && account._id) {
            rollbackPromises.push(accountModel.findOne({_id: account._id}).remove().exec());
        }
        if (consent && consent._id) {
            rollbackPromises.push(consentModel.consentModel.findOne({_id: consent._id}).remove().exec());
        }
        Promise.all(rollbackPromises)
		.catch(err => {
			return Promise.reject(new errors.BadRequest((err.error||{}).message || err.message || err || "Kritischer Fehler bei der Registrierung. Bitte wenden sie sich an den Administrator."));
		})
		.then(() => {
			return Promise.reject(new errors.BadRequest((err.error||{}).message || err.message || err || "Fehler bei der Registrierung."));
		});
		return Promise.reject(new errors.BadRequest((err.error||{}).message || err.message || err || "Fehler bei der Registrierung."));
    });
};

module.exports = function (app) {

	class RegistrationService {
		constructor() {

        }
        
		create(data, params) {
			return registerStudent(data, params, app);
		}
	}

	return RegistrationService;
};
