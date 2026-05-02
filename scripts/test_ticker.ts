import yf from "yahoo-finance2";

async function testTicker() {
  const ticker = "SES-WT";
  try {
    const quote = await yf.quote(ticker);
    console.log("Quote found");
    const summary = await yf.quoteSummary(ticker, {
      modules: ["financialData", "summaryDetail", "assetProfile"],
    });
    console.log("Summary found");
  } catch (error: any) {
    console.log("Error fetching SES-WT:", error.message);
  }
}

testTicker();
