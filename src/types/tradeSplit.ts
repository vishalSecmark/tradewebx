export interface TradeRow {
    _id: number;
    SerialNo: number;
    Company?: string;
    TradeDate?: string;
    Settlement?: string;
    Client: string;
    ClientName?: string;
    Scrip: string;
    ScripName?: string;
    BuySell: string;
    BuyQty?: number;
    BuyValue?: number;
    SellQty?: number;
    SellValue?: number;
    MarketRate?: number;
    Brokerage?: number;
    NetRate?: number;
    NetValue?: number;
    FinalAmount?: number;
    FinalQty: number;
    DPAccountNo: string;
    BaseTrade?: string | null;
    [key: string]: any;
}

export interface SummaryRow {
    _id: number;
    SerialNo: number;
    Settlement: string;
    Client: string;
    ClientName: string;
    Scrip: string;
    ScripName: string;
    BuySell: string;
    BuyQty: number;
    SellQty: number;
    [key: string]: any;
}

export interface DPOption {
    label: string;
    value: string;
    qty?: number;
}

export interface ValueBasedColor {
    key: string;
    checkNumber: number;
    lessThanColor: string;
    greaterThanColor: string;
    equalToColor: string;
}

export interface DecimalColumn {
    key: string;
    decimalPlaces: number;
}

export interface TradeSplitProps {
    data: any[];
    settings?: {
        gridType?: string;
        gridDirection?: string;
        borderStyle?: string;
        fontSize?: number;
        hideColumnLabels?: string;
        hideEntireColumn?: string;
        textColors?: Array<{ key: string; value: string }>;
        valueBasedTextColor?: ValueBasedColor[];
        dateFormat?: { key: string; format: string };
        leftAlignedColums?: string;
        decimalColumns?: DecimalColumn[];
        [key: string]: any;
    };
    filters?: any;
}

export interface GroupKey {
    Scrip: string;
    SerialNo: number;
    Client: string;
    BuySell: string;
}

export interface TradeSplitModalProps {
    isOpen: boolean;
    onClose: () => void;
    summaryRow: any; // Type as any for flexibility or SummaryRow if strict
    filters: any;
}
