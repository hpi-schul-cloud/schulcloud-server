_teaminviteduserschemas [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { email: new Int32(1) },
    name: 'email_1',
    background: true
  }
]
_teamuserschemas [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { userId: new Int32(1) },
    name: 'userId_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    background: true
  }
]
accounts [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { userId: new Int32(1), systemId: new Int32(1) },
    name: 'userId_1_systemId_1'
  },
  {
    v: new Int32(2),
    key: { username: new Int32(1) },
    name: 'username_1',
    sparse: false
  }
]
activations [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { activationCode: new Int32(1) },
    name: 'activationCode_1',
    background: true,
    unique: true
  },
  {
    v: new Int32(2),
    key: { userId: new Int32(1), keyword: new Int32(1) },
    name: 'userId_1_keyword_1',
    background: true,
    unique: true
  },
  {
    v: new Int32(2),
    key: { createdAt: new Int32(1) },
    name: 'createdAt_1',
    background: true,
    expireAfterSeconds: new Int32(604800)
  }
]
analytics [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
base64files [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    background: true
  }
]
board [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
board-element [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { boardElementType: new Int32(1) },
    name: 'boardElementType_1',
    sparse: false
  }
]
classes [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { source: new Int32(1) },
    name: 'source_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { teacherIds: new Int32(1) },
    name: 'teacherIds_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { year: new Int32(1), ldapDN: new Int32(1) },
    name: 'year_1_ldapDN_1',
    background: true
  }
]
consents [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
consents_history [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
consentversions [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { consentTypes: new Int32(1) },
    name: 'consentTypes_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { publishedAt: new Int32(1) },
    name: 'publishedAt_1',
    background: true
  }
]
counties [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
coursegroups [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1), courseId: new Int32(1) },
    name: 'schoolId_1_courseId_1'
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { userIds: new Int32(1) },
    name: 'userIds_1',
    sparse: false
  }
]
courses [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { substitutionIds: new Int32(1) },
    name: 'substitutionIds_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { teacherIds: new Int32(1) },
    name: 'teacherIds_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { userIds: new Int32(1) },
    name: 'userIds_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { untilDate: new Int32(1) },
    name: 'untilDate_1',
    sparse: true
  },
  {
    v: new Int32(2),
    key: { shareToken: new Int32(1) },
    name: 'shareToken_1',
    unique: true,
    sparse: true
  },
  {
    v: new Int32(2),
    key: { source: new Int32(1) },
    name: 'source_1',
    background: true
  }
]
dashboard [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
dashboarddefaultreference [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
dashboardelement [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
datasourceruns [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
datasources [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
directories [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
federalstates [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
filepermissionmodels [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
filerecords [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { school: new Int32(1), parent: new Int32(1) },
    name: 'school_1_parent_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { 'securityCheck.requestToken': new Int32(1) },
    name: 'securityCheck.requestToken_1'
  }
]
files [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { isDirectory: new Int32(1) },
    name: 'isDirectory_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { deleted: new Int32(1) },
    name: 'deleted_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { deletedAt: new Int32(1) },
    name: 'deletedAt_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { parent: new Int32(1) },
    name: 'parent_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { creator: new Int32(1) },
    name: 'creator_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { _fts: 'text', _ftsx: new Int32(1) },
    name: 'name_text',
    background: true,
    weights: { name: new Int32(1) },
    default_language: 'english',
    language_override: 'language',
    textIndexVersion: new Int32(3)
  },
  {
    v: new Int32(2),
    key: {
      'permissions.refId': new Int32(1),
      'permissions.refPermModel': new Int32(1)
    },
    name: 'permissions.refId_1_permissions.refPermModel_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { owner: new Int32(1), parent: new Int32(1) },
    name: 'owner_1_parent_1',
    background: true
  }
]
gradelevels [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
grades [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
helpdocuments [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
histories [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
homeworks [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { archived: new Int32(1), courseId: new Int32(1) },
    name: 'archived_1_courseId_1'
  },
  {
    v: new Int32(2),
    key: { id: new Int32(1), private: new Int32(1) },
    name: 'id_1_private_1'
  },
  {
    v: new Int32(2),
    key: {
      private: new Int32(1),
      dueDate: new Int32(1),
      archived: new Int32(1)
    },
    name: 'private_1_dueDate_1_archived_1'
  },
  {
    v: new Int32(2),
    key: { dueDate: new Int32(1) },
    name: 'dueDate_1',
    sparse: true
  },
  {
    v: new Int32(2),
    key: { teacherId: new Int32(1) },
    name: 'teacherId_1',
    sparse: true
  },
  {
    v: new Int32(2),
    key: { courseId: new Int32(1) },
    name: 'courseId_1',
    sparse: true
  },
  {
    v: new Int32(2),
    key: { lessonId: new Int32(1) },
    name: 'lessonId_1',
    sparse: true
  },
  {
    v: new Int32(2),
    key: { archived: new Int32(1) },
    name: 'archived_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { fileIds: new Int32(1) },
    name: 'fileIds_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { archived: new Int32(1), schoolId: new Int32(1) },
    name: 'archived_1_schoolId_1',
    background: true
  }
]
importusers [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { match_userId: new Int32(1) },
    name: 'match_userId_1',
    unique: true,
    partialFilterExpression: { match_userId: [Object] }
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1), email: new Int32(1) },
    name: 'schoolId_1_email_1',
    unique: true
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1), ldapDn: new Int32(1) },
    name: 'schoolId_1_ldapDn_1',
    unique: true
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1), ldapId: new Int32(1) },
    name: 'schoolId_1_ldapId_1',
    unique: true
  }
]
keys [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
lessons [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { hidden: new Int32(1) },
    name: 'hidden_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { courseId: new Int32(1) },
    name: 'courseId_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { shareToken: new Int32(1) },
    name: 'shareToken_1',
    background: true,
    unique: true,
    sparse: true
  },
  {
    v: new Int32(2),
    key: { courseGroupId: new Int32(1) },
    name: 'courseGroupId_1',
    background: true
  }
]
links [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { target: new Int32(1) },
    name: 'target_1',
    background: true
  }
]
ltitools [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { friendlyUrl: new Int32(1) },
    name: 'friendlyUrl_1',
    background: true,
    unique: true,
    sparse: true
  }
]
materials [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
migrations [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
news [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: {
      schoolId: new Int32(1),
      target: new Int32(1),
      targetModel: new Int32(1)
    },
    name: 'schoolId_1_target_1_targetModel_1'
  },
  {
    v: new Int32(2),
    key: { targetModel: new Int32(1) },
    name: 'targetModel_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { target: new Int32(1), targetModel: new Int32(1) },
    name: 'target_1_targetModel_1'
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1), target: new Int32(1) },
    name: 'schoolId_1_target_1'
  },
  {
    v: new Int32(2),
    key: { displayAt: new Int32(1) },
    name: 'displayAt_1',
    sparse: false
  }
]
newshistories [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
passwordRecovery [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
passwordrecoveries [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { token: new Int32(1) },
    name: 'token_1',
    background: true
  }
]
problems [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
pseudonyms [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { pseudonym: new Int32(1) },
    name: 'pseudonym_1',
    background: true,
    unique: true
  },
  {
    v: new Int32(2),
    key: { userId: new Int32(1), toolId: new Int32(1) },
    name: 'userId_1_toolId_1',
    background: true,
    unique: true
  }
]
registrationpins [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { importHash: new Int32(1) },
    name: 'importHash_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { email: new Int32(1), pin: new Int32(1) },
    name: 'email_1_pin_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { email: new Int32(1) },
    name: 'email_1',
    background: true
  }
]
releases [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
rocketchatchannels [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { teamId: new Int32(1) },
    name: 'teamId_1',
    background: true,
    unique: true
  }
]
rocketchatusers [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { userId: new Int32(1) },
    name: 'userId_1',
    background: true,
    unique: true
  },
  {
    v: new Int32(2),
    key: { username: new Int32(1) },
    name: 'username_1',
    background: true,
    unique: true
  }
]
roles [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { name: new Int32(1) },
    name: 'name_1',
    unique: true,
    sparse: false
  }
]
schoolgroups [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
schools [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { ldapSchoolIdentifier: new Int32(1), systems: new Int32(1) },
    name: 'ldapSchoolIdentifier_1_systems_1'
  },
  {
    v: new Int32(2),
    key: { 'rssFeeds.url': new Int32(1) },
    name: 'rssFeeds.url_1',
    background: true,
    unique: true,
    sparse: true
  },
  {
    v: new Int32(2),
    key: { source: new Int32(1) },
    name: 'source_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { purpose: new Int32(1) },
    name: 'purpose_1',
    background: true
  }
]
storageproviders [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { freeBuckets: new Int32(1) },
    name: 'freeBuckets_1',
    background: true
  }
]
submissions [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { studentId: new Int32(1), teamMembers: new Int32(1) },
    name: 'studentId_1_teamMembers_1'
  },
  {
    v: new Int32(2),
    key: { homeworkId: new Int32(1) },
    name: 'homeworkId_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { fileIds: new Int32(1) },
    name: 'fileIds_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { gradeFileIds: new Int32(1) },
    name: 'gradeFileIds_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    background: true
  }
]
systems [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
teams [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { 'userIds.userId': new Int32(1) },
    name: 'userIds.userId_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { 'userIds.schoolId': new Int32(1) },
    name: 'userIds.schoolId_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { 'invitedUserIds.email': new Int32(1) },
    name: 'invitedUserIds.email_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { schoolIds: new Int32(1) },
    name: 'schoolIds_1',
    background: true
  }
]
trashbins [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { userId: new Int32(1) },
    name: 'userId_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { createdAt: new Int32(1) },
    name: 'createdAt_1',
    background: true,
    expireAfterSeconds: new Int32(604800)
  }
]
users [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { roles: new Int32(1) },
    name: 'roles_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1), roles: new Int32(1) },
    name: 'schoolId_1_roles_1'
  },
  {
    v: new Int32(2),
    key: { ldapId: new Int32(1), schoolId: new Int32(1) },
    name: 'ldapId_1_schoolId_1'
  },
  {
    v: new Int32(2),
    key: { firstName: new Int32(1), lastName: new Int32(1) },
    name: 'firstName_1_lastName_1'
  },
  {
    v: new Int32(2),
    key: { id: new Int32(1), email: new Int32(1) },
    name: 'id_1_email_1'
  },
  {
    v: new Int32(2),
    key: { email: new Int32(1) },
    name: 'email_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1) },
    name: 'schoolId_1',
    sparse: false
  },
  {
    v: new Int32(2),
    key: { ldapId: new Int32(1) },
    name: 'ldapId_1',
    sparse: true
  },
  {
    v: new Int32(2),
    key: { source: new Int32(1) },
    name: 'source_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { importHash: new Int32(1) },
    name: 'importHash_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { ldapDn: new Int32(1) },
    name: 'ldapDn_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { schoolId: new Int32(1), ldapDn: new Int32(1) },
    name: 'schoolId_1_ldapDn_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { _fts: 'text', _ftsx: new Int32(1) },
    name: 'userSearchIndex',
    background: true,
    weights: {
      email: new Int32(15),
      emailSearchValues: new Int32(2),
      firstName: new Int32(15),
      firstNameSearchValues: new Int32(3),
      lastName: new Int32(15),
      lastNameSearchValues: new Int32(3)
    },
    default_language: 'none',
    language_override: 'de',
    textIndexVersion: new Int32(3)
  }
]
users_history [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
videoconferences [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { target: new Int32(1) },
    name: 'target_1',
    background: true
  },
  {
    v: new Int32(2),
    key: { target: new Int32(1), targetModel: new Int32(1) },
    name: 'target_1_targetModel_1',
    background: true
  }
]
webuntismetadatas [ { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' } ]
years [
  { v: new Int32(2), key: { _id: new Int32(1) }, name: '_id_' },
  {
    v: new Int32(2),
    key: { name: new Int32(1) },
    name: 'name_1',
    background: true,
    unique: true
  }
]