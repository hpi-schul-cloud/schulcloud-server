const parse = require('csv-parse/lib/sync');
const stripBOM = require('strip-bom');
const Syncer = require('./Syncer');

/**
 * Implements importing CSV documents based on the Syncer interface
 * @class CSVSyncer
 * @implements {Syncer}
 */
class CSVSyncer extends Syncer {
    constructor(app, stats = {}, school, role = 'student', sendEmails, csvData, params) {
        super(app, stats);
        this.schoolId = school;
        this.role = role;
        this.sendEmails = sendEmails;
        this.csvData = csvData;
        this.requestParams = params;

        Object.assign(this.stats, {
            users: {
                successful: 0,
                created: 0,
                updated: 0,
                failed: 0,
            },
            invitations: {
                successful: 0,
                failed: 0,
            },
            classes: {
                successful: 0,
                created: 0,
                updated: 0,
                failed: 0,
            },
        });
    }

    /**
     * @see {Syncer#respondsTo}
     */
    static respondsTo(target) {
        return target === 'csv';
    }

    /**
     * @see {Syncer#params}
     */
    static params(params, data = {}) {
        const query = (params || {}).query || {};
        if (query.school && query.role && data.data) {
            return [
                query.school,
                query.role,
                query.sendEmails === 'true',
                data.data,
                params,
            ];
        }
        return false;
    }

    /**
     * @see {Syncer#steps}
     */
    async steps() {
        await super.steps();
        const records = this.parseCsvData();
        const sanitizedRecords = CSVSyncer.sanitizeRecords(records);
        const clusteredRecords = this.clusterByEmail(sanitizedRecords);

        const actions = Object.values(clusteredRecords).map(record => async () => {
            const enrichedRecord = await this.enrichUserData(record);
            const user = await this.createOrUpdateUser(enrichedRecord);
            if (this.importClasses) {
                await this.createClasses(enrichedRecord, user);
            }
        });

        while (actions.length > 0) {
            const action = actions.shift();
            await action.apply(this);
        }

        return this.stats;
    }

    static requiredAttributes() {
        return ['firstName', 'lastName', 'email'];
    }

    parseCsvData() {
        let records = [];
        try {
            const strippedData = stripBOM(this.csvData);
            records = parse(strippedData, {
                columns: true,
                delimiter: ',',
            });
        } catch (error) {
            if (error.message && error.message.match(/Invalid Record Length/)) {
                const line = error.message.match(/on line (\d+)/)[1];
                this.stats.errors.push({
                    type: 'file',
                    entity: 'Eingabedatei fehlerhaft',
                    message: `Syntaxfehler in Zeile ${line}`,
                });
            } else {
                this.stats.errors.push({
                    type: 'file',
                    entity: 'Eingabedatei fehlerhaft',
                    message: 'Datei ist nicht im korrekten Format',
                });
            }
            throw error;
        }

        if (!Array.isArray(records) || records.length === 0) {
            this.logError('Parsing failed: No input data.');
            this.stats.errors.push({
                type: 'file',
                entity: 'Eingabedatei fehlerhaft',
                message: 'Datei enthält keine Daten',
            });
            throw new Error('No input data');
        }

        CSVSyncer.requiredAttributes().forEach((param) => {
            if (!records[0][param]) {
                this.stats.errors.push({
                    type: 'file',
                    entity: 'Eingabedatei fehlerhaft',
                    message: `benötigtes Attribut "${param}" nicht gefunden`,
                });
                throw new Error(`Parsing failed. Expected attribute "${param}"`);
            }
        });
        // validate optional params:
        if (records[0].class !== undefined) {
            this.importClasses = true;
        }
        return records;
    }

    static sanitizeRecords(records) {
        return records.map(record => ({
            ...record,
            email: record.email.trim().toLowerCase(),
        }));
    }

    clusterByEmail(records) {
        const recordsByEmail = {};
        records.forEach(async (record) => {
            if (recordsByEmail[record.email]) {
                this.stats.errors.push({
                    type: 'user',
                    entity: `${record.firstName},${record.lastName},${record.email}`,
                    message: `Mehrfachnutzung der E-Mail-Adresse "${record.email}". `
                        + 'Nur der erste Eintrag wird importiert, alle weiteren ignoriert.',
                });
                this.stats.users.failed += 1;
            } else {
                recordsByEmail[record.email] = record;
            }
        });
        return recordsByEmail;
    }

    async enrichUserData(record) {
        const linkData = await this.generateRegistrationLink({
            role: this.role,
            schoolId: this.schoolId,
            save: true,
            toHash: record.email,
        });
        const enrichedUser = Object.assign(record, {
            schoolId: this.schoolId,
            roles: [this.role],
            sendRegistration: true,
        });
        enrichedUser.importHash = linkData.hash;
        enrichedUser.shortLink = linkData.shortLink;
        return enrichedUser;
    }

    generateRegistrationLink(params) {
        return this.app.service('registrationlink').create(params);
    }

    async createOrUpdateUser(record) {
        const userId = await this.findUserIdForRecord(record);
        if (userId === null) {
            return this.createUser(record);
        }
        return this.updateUser(userId, record);
    }

    async findUserIdForRecord(record) {
        const users = await this.app.service('users').find({
            query: {
                email: record.email,
            },
            paginate: false,
            lean: true,
        }, this.requestParams);
        if (users.length >= 1) {
            return users[0]._id;
        }
        return null;
    }

    async createUser(record) {
        let userObject;
        try {
            userObject = await this.app.service('users').create(record, this.requestParams);
            this.stats.users.created += 1;
            this.stats.users.successful += 1;
            if (this.sendEmails) {
                await this.emailUser(record);
            }
        } catch (err) {
            this.logError('Cannot create user', record, JSON.stringify(err));
            this.handleUserError(err, record);
        }
        return userObject;
    }

    async updateUser(userId, record) {
        let userObject;
        try {
            const patch = {
                firstName: record.firstName,
                lastName: record.lastName,
            };
            const params = {
                /*
                query and payload need to be deleted, so that feathers doesn't want to update
                multiple database objects (or none in this case). We still need the rest of
                the requestParams to authenticate as Admin
                */
                ...this.requestParams,
                query: undefined,
                payload: undefined,
            };
            userObject = await this.app.service('users').patch(userId, patch, params);
            this.stats.users.updated += 1;
            this.stats.users.successful += 1;
        } catch (err) {
            this.logError('Cannot update user', record, JSON.stringify(err));
            this.handleUserError(err, record);
        }
        return userObject;
    }

    handleUserError(err, record) {
        this.stats.users.failed += 1;
        if (err.message.startsWith('user validation failed')) {
            this.stats.errors.push({
                type: 'user',
                entity: `${record.firstName},${record.lastName},${record.email}`,
                message: `Ungültiger Wert in Spalte "${err.message.match(/Path `(.+)` is required/)[1]}"`,
            });
        } else {
            this.stats.errors.push({
                type: 'user',
                entity: `${record.firstName},${record.lastName},${record.email}`,
                message: err.message,
            });
        }
    }

    async emailUser(user) {
        try {
            if (user && user.email && user.schoolId && user.shortLink) {
                await this.app.service('mails').create({
                    email: user.email,
                    subject: `Einladung für die Nutzung der ${process.env.SC_TITLE}!`,
                    headers: {},
                    content: {
                        text: `Einladung in die ${process.env.SC_TITLE}\n`
                            + `Hallo ${user.firstName} ${user.lastName}!\n\n`
                            + `Du wurdest eingeladen, der ${process.env.SC_TITLE} beizutreten, `
                            + 'bitte vervollständige deine Registrierung unter folgendem Link: '
                            + `${user.shortLink}\n\n`
                            + 'Viel Spaß und einen guten Start wünscht dir dein '
                            + `${process.env.SC_SHORT_TITLE}-Team`,
                    },
                });
                this.stats.invitations.successful += 1;
            } else {
                throw new Error('Invalid user object');
            }
        } catch (err) {
            this.stats.invitations.failed += 1;
            this.stats.errors.push({
                type: 'invitation',
                entity: user.email,
                message: 'Die automatische Einladungs-E-Mail konnte nicht gesendet werden. Bitte manuell einladen.',
            });
            this.logError('Cannot send invitation link to user', err);
        }
    }

    async createClasses(record, user) {
        if (user === undefined) return;
        const classes = CSVSyncer.splitClasses(record.class);
        const classMapping = await this.buildClassMapping(classes);

        const actions = classes.map(async (klass) => {
            const classObject = classMapping[klass];
            if (classObject === undefined) return;

            const collection = this.role === 'teacher' ? 'teacherIds' : 'userIds';
            const importIds = classObject[collection].map(uid => uid.toString());
            if (!importIds.includes(user._id.toString())) {
                const patchData = {};
                patchData[collection] = [...importIds, user._id.toString()];
                await this.app.service('/classes').patch(classObject._id, patchData);
            }
        });
        await Promise.all(actions);
    }

    static splitClasses(classes) {
        return classes.split('+').filter(name => name !== '');
    }

    async getClassObject(klass) {
        const formats = [
            {
                regex: /^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/,
                values: async (string) => {
                    const gradeLevelName = string.match(/^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/)[1];
                    const gradeLevel = await this.findGradeLevel({
                        name: gradeLevelName,
                    });
                    return {
                        nameFormat: 'gradeLevel+name',
                        name: string.match(/^(?:0)*(?:(?:1[0-3])|[1-9])(\D.*)$/)[1],
                        gradeLevel,
                    };
                },
            },
            {
                regex: /(.*)/,
                values: string => ({
                    nameFormat: 'static',
                    name: string,
                }),
            },
        ];
        const classNameFormat = formats.find(format => format.regex.test(klass));
        if (classNameFormat !== undefined) {
            return Object.assign(await classNameFormat.values(klass), {
                schoolId: this.schoolId,
            });
        }
        throw new Error('Class name does not match any format:', klass);
    }

    async buildClassMapping(classes) {
        const classMapping = {};
        await Promise.all(classes.map(async (klass) => {
            try {
                if (classMapping[klass] === undefined) {
                    const classObject = await this.getClassObject(klass);
                    classMapping[klass] = await this.findOrCreateClass(classObject);
                }
                this.stats.classes.successful += 1;
            } catch (err) {
                this.stats.classes.failed += 1;
                this.stats.errors.push({
                    type: 'class',
                    entity: klass,
                    message: err.message,
                });
                this.logError('Failed to create class', klass, err);
            }
            return Promise.resolve();
        }));
        return classMapping;
    }

    async findOrCreateClass(classObject) {
        const existing = await this.app.service('/classes').find({
            query: classObject,
            paginate: false,
            lean: true,
        });
        if (existing.length === 0) {
            const newClass = this.app.service('/classes').create(classObject);
            this.stats.classes.created += 1;
            return newClass;
        }
        this.stats.classes.updated += 1;
        return existing[0];
    }

    async findGradeLevel(query) {
        const existing = await this.app.service('/gradeLevels').find({
            query,
            paginate: false,
            lean: true,
        });
        if (existing.length >= 0) {
            return existing[0];
        }
        throw new Error('Invalid grade level');
    }
}

module.exports = CSVSyncer;
