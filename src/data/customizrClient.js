/* eslint-disable camelcase */
const rp = require("request-promise");

class CustomizrClient {
  constructor(authorizationHeader) {
    this.authorizationHeader = authorizationHeader;
    this.customizerURL =
      "https://customizr.at.cimpress.io/v1/resources/penguin/settings";
  }

  getPreferences() {
    return rp(this.customizerURL, {
      headers: {
        Authorization: this.authorizationHeader
      }
    }).then(response => JSON.parse(response));
  }

  setPreferences(data) {
    return rp(this.customizerURL, {
      method: "PUT",
      json: data,
      headers: {
        Authorization: this.authorizationHeader
      }
    }).then(() => data);
  }
}

module.exports = CustomizrClient;
