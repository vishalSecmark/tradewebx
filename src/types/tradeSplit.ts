export interface TradeRow {
    _id: number;
    SerialNo: number;
    Settlement: string;
    ClientName: string;
    Scrip: string;
    ScripName: string;
    BuySell: string; // "B" | "S"
    Qty: number;
    FinalQty: number;
    DPAccountNo: string;
    HoldingQty: number;
    [key: string]: any;
}

// Group interface for validation
export interface TradeGroup {
    SerialNo: number;
    Scrip: string;
    BuySell: string;
    TotalBuyQty: number;
    TotalSellQty: number;
    Rows: TradeRow[];
}

export interface TradeSplitProps {
    data: any[]; // Raw data from props, to be mapped to TradeRow
    settings?: any;
    filters?: any;
    isAutoWidth?: boolean;
}
