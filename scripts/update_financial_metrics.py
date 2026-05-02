import os
import time
import yfinance as yf
from supabase import create_client, Client
from dotenv import load_dotenv

# 環境変数の読み込み (.env または .env.local)
load_dotenv('.env.local')
load_dotenv('.env')

# 環境変数名が異なる場合も想定したフォールバック
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase URLまたはService Role Keyが環境変数に見つかりません。")
    print(".env ファイルを確認してください。")
    exit(1)

# Supabaseクライアントの初期化
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 処理の設定 ---
SLEEP_BETWEEN_REQUESTS = 0.5 # APIリクエスト間の待機時間(秒): レートリミット対策

def format_symbol_for_yf(symbol: str, market: str) -> str:
    """日本の証券コードをyfinance用にフォーマットする"""
    # marketカラムがJP、かつ数字のみ（例: 7203）の場合は.Tを付与
    if market == 'JP' and symbol.isdigit():
        return f"{symbol}.T"
    return symbol

def get_equity_ratio(ticker: yf.Ticker):
    """
    自己資本比率を計算・取得する
    yfinanceはinfoから取得できないケースが多いため、必要に応じてbalance_sheetを参照します。
    """
    try:
        # yfinanceのbalance_sheetを利用
        bs = ticker.balance_sheet
        if bs is not None and not bs.empty:
            # yfinanceのキーは時期により変動するため、複数候補で探す
            equity_keys = ['Stockholders Equity', 'Total Stockholder Equity', 'Total Equity Gross Minority Interest']
            asset_keys = ['Total Assets']
            
            equity = None
            assets = None
            
            for key in equity_keys:
                if key in bs.index:
                    equity = bs.loc[key].iloc[0]
                    break
            
            for key in asset_keys:
                if key in bs.index:
                    assets = bs.loc[key].iloc[0]
                    break
            
            if equity is not None and assets is not None and assets > 0:
                # pandasのNaN等は弾いてfloat変換
                if equity == equity and assets == assets: 
                    return float(equity / assets)
    except Exception:
        pass
    return None

def fetch_financial_metrics(symbol: str, market: str):
    """yfinanceからROE、自己資本比率、売上高成長率を取得する"""
    yf_symbol = format_symbol_for_yf(symbol, market)
    try:
        ticker = yf.Ticker(yf_symbol)
        info = ticker.info
        
        roe = info.get('returnOnEquity')
        sales_growth_rate = info.get('revenueGrowth')
        equity_ratio = get_equity_ratio(ticker)
        
        return {
            "roe": roe if isinstance(roe, (int, float)) else None,
            "equity_ratio": equity_ratio,
            "sales_growth_rate": sales_growth_rate if isinstance(sales_growth_rate, (int, float)) else None
        }
    except Exception as e:
        print(f"  [Error] Data fetch failed for {yf_symbol}: {e}")
        # クラッシュさせず、すべてNULL(None)として扱う
        return {
            "roe": None,
            "equity_ratio": None,
            "sales_growth_rate": None
        }

def process_tickers():
    print("Starting financial metrics update process...")
    
    # 1. Supabaseから全対象データを取得
    all_tickers = []
    limit = 1000
    offset = 0
    
    print("Fetching tickers from Supabase...")
    while True:
        # id（主キー）を取得しておくことで安全なバルクアップデートが可能になります
        response = supabase.table("tickers").select("id, symbol, market").range(offset, offset + limit - 1).execute()
        data = response.data
        if not data:
            break
        all_tickers.extend(data)
        offset += limit
        
    total_tickers = len(all_tickers)
    print(f"Found {total_tickers} tickers to process.\n")
    
    # 2. データ取得と順次更新ループ
    processed_count = 0
    
    for item in all_tickers:
        row_id = item['id']
        symbol = item['symbol']
        market = item['market']
        
        metrics = fetch_financial_metrics(symbol, market)
        
        # 1件ずつ安全にUpdate（GENERATED ALWAYS制約を回避）
        try:
            supabase.table("tickers").update({
                "roe": metrics['roe'],
                "equity_ratio": metrics['equity_ratio'],
                "sales_growth_rate": metrics['sales_growth_rate']
            }).eq("id", row_id).execute()
        except Exception as e:
            print(f"  [Error] Failed to update {symbol} in database: {e}")
        
        processed_count += 1
        if processed_count % 10 == 0 or processed_count == total_tickers:
            print(f"[{processed_count}/{total_tickers}] Processed & Updated {symbol}...")
            
        # APIレートリミット対策のための待機
        time.sleep(SLEEP_BETWEEN_REQUESTS)

    print("\nProcess completed successfully.")

if __name__ == "__main__":
    process_tickers()
