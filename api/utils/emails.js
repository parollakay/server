const signature = '<br>Thank you so much, God Bless you, epi Have a good night!<br><br><b>Jorge</b><br><small>from wap konn Jorge.. yo bam on ti job!</small>'
module.exports = {
  welcome: {
    subject: 'Welcome To Parol Lakay!',
    html: `Now... you are a member of <b>Parol Lakay</b>.<br>Ok, lemme tell you whats happen now... you can add Words, Definitions, Sentences, and even voté on everything. ok? ${signature}`
  },
  newDefinition: {
    subject: 'New Definition Added!',
    html: (term) => `<b>Eps!</b><br><br>Your new definition for ${term} has been submitted to <b>Parol Lakay</b>.${signature}`
  },
  resetpassword: {
    subject: 'Change Password',
    html: (token) => 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
    'https://parollakay.com/reset/' + token + '\n\n' +
    'If you did not request this, please ignore this email and your password will remain unchanged.\n' + signature
  },
  pwResetSuccess: {
    subject: 'Password Reset',
    html: `Now... <br> Your password is changed. Good job. ${signature}`
  }
}