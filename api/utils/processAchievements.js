const achievements = require('./achievements');

module.exports =  {
  fn: user => {
    const numTerms = user.terms.length;
    if (numTerms >= 1804) return user;
    if (user.nextAchievementMin > numTerms) return user;
    for (let i = 0; i < achievements.length; i++) {
      if (achievements[i].min === user.nextAchievementMin) {
        // add the next achievement with that min to the user,
        // change the nextAchievementMin to the one of the next one,
        user.achievements.push(achievements[i]);
        user.nextAchievementMin = achievements[i + 1].min;
        user.toNextAchievement = achievements[i + 1].min - numTerms;
        return user
      }
    }
  }
}