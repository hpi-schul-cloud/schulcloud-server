const errors = require('feathers-errors');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const consentModel = require('../consent/model');
const globalHooks = require('../../hooks');

const formatBirthdate1=(datestamp)=>{
	if( datestamp==undefined )
		return false;
	
	const d = datestamp.split('.');
	return d[1]+'.'+d[0]+'.'+d[2];
};

const populateUser = (app, data) => {
    let oldUser = {};
    let user = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roles: ["student"],
        schoolId: data.schoolId,
    };

    let formatedBirthday = formatBirthdate1(data.birthDate);
    if (formatedBirthday) {
        user.birthday = new Date(formatedBirthday);
    }

    if (data.classId) user.classId = data.classId;
    if (data.gender) user.gender = data.gender;
    
    if(data.importHash){
		return app.service('users').find({ query: { importHash: data.importHash, _id: data.userId, $populate: ['roles'] }} ).then(users=>{
			if(users.data.length<=0 || users.data.length>1){
				throw new errors.BadRequest("Kein Nutzer für die eingegebenen Daten gefunden.");
			}
			oldUser=users.data[0];
			Object.keys(oldUser).forEach(key=>{
				if( oldUser[key]!==null ){
					user[key]=oldUser[key];
				}
            });
            user.roles = user.roles.map(role => {
                if (role.name) {
                    return role.name;
                }
            });
            delete user.importHash;
            return {user, oldUser};
        });
    }
    return Promise.resolve({user, oldUser});
};

const insertUserToDB = (app,data,user)=> {
	if(user._id){
        return app.service('users').remove(user._id).then( ()=>{
            return app.service('users').create(user, { _additional:{parentEmail:data.parent_email, asTask:'student'} })
            .catch(err=> {
                 throw new errors.BadRequest("Fehler beim Updaten der Nutzerdaten.");}
            );
        });
	}else{	
		return app.service('users').create(user, { _additional:{parentEmail:data.parent_email, asTask:'student'} })
		.catch(err=> {throw new errors.BadRequest("Fehler beim Erstellen des Nutzers. Eventuell ist die E-Mail-Adresse bereits im System registriert.");} );
	}
};

const registerUser = function(data, params, app) {
    let parent = null, user = null, oldUser = null, account = null, consent = null, consentPromise = null;

    return new Promise(function (resolve, reject) {
        resolve();
    }).then(function () {
        let classPromise = null, schoolPromise = null;
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
            });
    }).then(function () {
        return populateUser(app, data)
        .then(response => {
            user = response.user;
            oldUser = response.oldUser;
        });
    }).then(function () {
        if ((user.roles||[]).includes("student")) {
            // wrong birthday object?
            if (user.birthday instanceof Date && isNaN(user.birthday)) {
                return Promise.reject(new errors.BadRequest("Fehler bei der Erkennung des ausgewählten Geburtstages. Bitte lade die Seite neu und starte erneut."));
            }
            // wrong age?
            let age = globalHooks.getAge(user.birthday);
            if (data.parent_email && age >= 18) {
                return Promise.reject(new errors.BadRequest(`Schüleralter: ${age} Im Elternregistrierungs-Prozess darf der Schüler nicht 18 Jahre oder älter sein.`));
            } else if (!data.parent_email && age < 18) {
                return Promise.reject(new errors.BadRequest(`Schüleralter: ${age} Im Schülerregistrierungs-Prozess darf der Schüler nicht jünger als 18 Jahre sein.`));
            }
        }
        
        // identical emails?
        if (data.parent_email && data.parent_email === data.email) {
            return Promise.reject(new errors.BadRequest("Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an."));
        }

        if (data.password_1 && data.passwort_1 !== data.passwort_2) {
            return new errors.BadRequest("Die Passwörter stimmen nicht überein");
        } 
        return Promise.resolve();       
    }).then(function () {
        let userMail = data.parent_email || data.student_email || data.email;
        let pinInput = data.pin;
        return app.service('registrationPins').find({
            query: { "pin": pinInput, "email": userMail, verified: false }
        }).then(check => {
            //check pin
            if (!(check.data && check.data.length > 0 && check.data[0].pin === pinInput)) {
                return Promise.reject("Ungültige Pin, bitte überprüfe die Eingabe.");
            }
            return Promise.resolve();
        });
    }).then(function() {
        //create user
        return insertUserToDB(app,data,user)
        .then(newUser => {
            user = newUser;
        });
    }).then(() => {
        account = {
            username: user.email, 
            password: data.password_1, 
            userId: user._id, 
            activated: true
        };
		if( data.sso === 'sso' && data.accountId ){

			let accountId = data.accountId;
			return app.service('accounts').update({_id: accountId}, {$set: {activated: true, userId: user._id}})
			.then(accountResponse=>{
				account = accountResponse;
			})
			.catch(err=>{
				return Promise.reject(new Error("Fehler der Account existiert nicht."));
			});
		}else{
			return app.service('accounts').create(account)
				.then(newAccount => {account = newAccount;})
				.catch(err => {
					return Promise.reject(new Error("Fehler beim Erstellen des Accounts."));
				});
		}
        
    }).then(res => {
        //add parent if necessary    
        if(data.parent_email) {
            parent = {
                firstName: data.parent_firstName,
                lastName: data.parent_lastName,
                email: data.parent_email,
                children: [user._id],
                schoolId: data.schoolId,
                roles: ["parent"]
            };
            return app.service('users').create(parent, { _additional:{asTask:'parent'} })
            .catch(err => {
                if (err.message.startsWith("parentCreatePatch")) {
                    return Promise.resolve(err.data);
                } else {
                    return Promise.reject(new Error("Fehler beim Erstellen des Elternaccounts."));
                }
            }).then(newParent => {
                parent = newParent;
                return userModel.userModel.findByIdAndUpdate(user._id, {parents: [parent._id] }, {new: true}).exec()
                .then(updatedUser => user = updatedUser);
            }).catch(err => {
                return Promise.reject("Fehler beim Verknüpfen der Eltern.");
            }) ;
        } else {
            return Promise.resolve();
        }
    }).then(function(){
        //store consent
        consent = {
            form: 'digital',
            privacyConsent: data.privacyConsent,
            thirdPartyConsent: data.thirdPartyConsent,
            termsOfUseConsent: data.termsOfUseConsent,
            researchConsent: data.researchConsent
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
        return Promise.resolve({user, parent, account, consent});
    }).catch(err => {
        let rollbackPromises = [];
        if (user && user._id) {
            rollbackPromises.push(userModel.userModel.findOneAndRemove({_id: user._id}).exec()
            .then(_ => {
                if (oldUser) {
                    return userModel.userModel.create(oldUser);
                }
            }));
                 
        }
        if (parent && parent._id) {
            rollbackPromises.push(userModel.userModel.findOneAndRemove({_id: parent._id}).exec());
        }
        if (account && account._id) {
            rollbackPromises.push(accountModel.findOneAndRemove({_id: account._id}).exec());
        }
        if (consent && consent._id) {
            rollbackPromises.push(consentModel.consentModel.findOneAndRemove({_id: consent._id}).exec());
        }
        return Promise.all(rollbackPromises)
		.catch(err => {
			return Promise.reject(new errors.BadRequest((err.error||{}).message || err.message || err || "Kritischer Fehler bei der Registrierung. Bitte wenden sie sich an den Administrator."));
		})
		.then(() => {
			return Promise.reject(new errors.BadRequest((err.error||{}).message || err.message || err || "Fehler bei der Registrierung."));
		});
    });
};

module.exports = function (app) {

	class RegistrationService {
		constructor() {

        }
        
		create(data, params) {
			return registerUser(data, params, app);
		}
	}

	return RegistrationService;
};
