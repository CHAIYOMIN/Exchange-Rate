require("dotenv").config();
const Octokit = require("@octokit/rest");
const axios = require("axios");
const wrapAnsi = require("wrap-ansi");
const EXCHANE_RATE_URL = "https://api.exchangerate.host/latest";

const { GIST_ID: gistId, GH_TOKEN: githubToken, BASE: BASE } = process.env;

const octokit = new Octokit({
  auth: `token ${githubToken}`
});

async function main() {
  if (!GIST_ID || !GH_TOKEN) {
    console.error("gist ID or github token not found");
  }

  let response, exchageRateUrl;
  if (BASE) {
    exchageRateUrl = `${EXCHANE_RATE_URL}?base=${BASE}`;
  } else {
    exchageRateUrl = `${EXCHANE_RATE_URL}?base=${USD}`;
  }

  response = await axios.get(exchageRateUrl);

  const exchage = response.data.rates;
  await updateGist(exchage);
}

async function updateGist(exchage) {
  let gist;
  try {
    gist = await octokit.gists.get({ gist_id: gistId });
  } catch (error) {
    console.error(`Unable to get gist\n${error}`);
  }
  // Get original filename to update that same file
  const filename = Object.keys(gist.data.files)[0];

  try {
    await octokit.gists.update({
      gist_id: gistId,
      files: {
        [filename]: {
          filename: `Exchange Rate - ${BASE} base`,
          content: wrapAnsi(exchage, 20, { hard: true })
        }
      }
    });
  } catch (error) {
    console.error(`Unable to update gist\n${error}`);
  }
}

(async () => {
  await main();
})();
