require("dotenv").config();
const Octokit = require("@octokit/rest");
const axios = require("axios");
const EXCHANGE_RATE_URL = "https://api.exchangerate.host/latest";

const {
  GIST_ID: gistId,
  GH_TOKEN: githubToken,
  BASE: BASE,
  COUNTRY: COUNTRY
} = process.env;

const octokit = new Octokit({
  auth: `token ${githubToken}`
});

async function main() {
  if (!gistId || !githubToken) {
    console.error("gist ID or github token not found");
  }

  let response, exchangeRateUrl;
  let country = COUNTRY.split(" ");
  let countryUrl = "&symbols=";
  for (const value of country) {
    countryUrl += value + ",";
  }
  countryUrl = countryUrl.slice(0, -1);

  if (BASE) {
    exchangeRateUrl = `${EXCHANGE_RATE_URL}?base=${BASE}${countryUrl}`;
  } else {
    exchangeRateUrl = `${EXCHANGE_RATE_URL}?base=USD${countryUrl}`;
  }

  response = await axios.get(exchangeRateUrl);

  const exchange = response.data.rates;
  const exchangeKeys = Object.keys(exchange);
  let exchangeData = [];
  for (const value of exchangeKeys) {
    exchangeData.push([value + ":" + exchange[value]]);
  }
  await updateGist(exchangeData);
}

async function updateGist(exchange) {
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
          content: exchange.join("\n")
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
