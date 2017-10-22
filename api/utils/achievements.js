module.exports = {
  data: [
    {
      min: 1,
      name: 'Blage',
      description: 'Submitted your first definition.'
    },
    {
      min: 3,
      name: 'Abitan',
      description: `You're well on your way. Keep it up.`
    },
    {
      min: 10,
      name: 'Peyizan',
      description: `Looks like you're very comfortable here.`
    },
    {
      min: 25,
      name: 'Blage',
      description: 'You know a lot of words. Congrats!'
    },
    {
      min: 50,
      name: 'Zoe',
      description: `lol, 50 words huh? look at you!`
    },
    {
      min: 150,
      name: 'Elev',
      description: `You're doing good! Keep it up.`
    },
    {
      min: 250,
      name: 'Diaspora',
      description: 'You can officially hang with the big guys.'
    },
    {
      min: 500,
      name: 'Citwayen',
      description: 'You really know your way around the language.'
    },
    {
      min: 850,
      name: 'Profese',
      description: 'You can teach the language, and the slang.'
    },
    {
      min: 1804,
      name: 'Haitian Royalty',
      description: 'You have submitted 1804 terms. You a Haitian King/Queen.'
    },
  ],
  get: function(min) {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].min === min) {
        return this.data[i];
      }
    }
  },
  next: function(current) {
    if (current >= 1804) return 1804;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].min === current) {
        return this.data[i + 1].min;
      }
    }
  }
}