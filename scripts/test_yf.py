import yfinance as yf
import json

ticker = yf.Ticker("7203.T")
info = ticker.info

metrics = {
    "returnOnEquity": info.get("returnOnEquity"),
    "revenueGrowth": info.get("revenueGrowth"),
    "debtToEquity": info.get("debtToEquity"),
    "totalAssets": info.get("totalAssets"),
    "totalStockholderEquity": info.get("totalStockholderEquity") # might not be there
}
print(json.dumps(metrics, indent=2))
