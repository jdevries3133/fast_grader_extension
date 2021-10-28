chrome.identity.getAuthToken(
  {
    interactive: true,
  },
  async function (token) {
    if (chrome.runtime.lastError) {
      return;
    }
    console.log(token);
    res = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" +
        token
    );
    jsn = await res.json();
    console.log(jsn);
  }
);
