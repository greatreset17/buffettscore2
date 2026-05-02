import yf from "yahoo-finance2";
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

async function test2038() {
  const ticker = "2038.T";
  try {
    const quote = await yahooFinance.quote(ticker);
    console.log("Quote Name:", quote.longName || quote.shortName);
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

test2038();
