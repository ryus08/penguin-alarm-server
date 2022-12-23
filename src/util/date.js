const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

module.exports = {
  minuteDiff: (date1, date2) => {
    const diff = Math.abs(new Date(date1) - new Date(date2));
    return Math.floor(diff / 1000 / 60);
  },

  dateDiff: dateString => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(dateString);
    currentDate.setHours(0, 0, 0, 0);
    return Math.round(
      Math.abs((today.getTime() - currentDate.getTime()) / oneDay)
    );
  }
};
