const Mailchimp = require('mailchimp-api-3');
const mailchimp = new Mailchimp(process.env.MAILCHIMP_API);

const getList = (type) => {
  switch(type){
    case 'MEMBER':
      return '61e49f697a';
    case 'WEEKLYWORD':
      return '0abf8f1302';
    default:
      return '0abf8f1302';
  }
}

module.exports = {
  MEMBER: 'MEMBER',
  WEEKLYWORD: 'WEEKLYWORD',
  addToList: (email, type) => {
    const list = getList(type);
    return new Promise((resolve, reject) => {
      mailchimp.members.create(list, {
        email_address: email,
        merge_fields: {
          EMAIL: email
        },
        status: 'subscribed'
      }).then(user => resolve(user), e => reject(e));
    });
  },
  getMembers: (type) => {
    const list = getList(type);
    return new Promise((resolve, reject) => {
      mailchimp.members.getAll(list).then(users => resolve(users), e => reject(e));
    });
  },
  removeMember: (email, type) => {
    const list = getList(type);
    return new Promise((resolve, reject) => {
      mailchimp.members.remove(list, email).then(res => resolve(res), e => reject(e));
    });
    
  }
}