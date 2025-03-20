import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';

interface CommonState {
    tableStyle: 'small' | 'medium' | 'large';
    lastTradingDate: string | null;
    companyLogo: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: CommonState = {
    tableStyle: 'small',
    lastTradingDate: null,
    companyLogo: null,
    status: 'idle',
    error: null,
};

// Async thunk for fetching last trading date
export const fetchLastTradingDate = createAsyncThunk(
    'common/fetchLastTradingDate',
    async () => {
        const userId = localStorage.getItem('userId') || '';
        const xmlData = `<dsXml>
            <J_Ui>"ActionName":"tradeweb", "Option":"LastTradingDate","Level":1, "RequestFrom":"W"</J_Ui>
            <Sql></Sql>
            <X_Filter></X_Filter>
            <X_GFilter></X_GFilter>
            <J_Api>"UserId":"${userId}"</J_Api>
        </dsXml>`;

        const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
            headers: {
                'Content-Type': 'application/xml',
                'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
            }
        });

        return response.data.data.rs0[0].LastTradeDate || '';
    }
);

// Async thunk for initializing login and getting company logo
export const initializeLogin = createAsyncThunk(
    'common/initializeLogin',
    async () => {
        const xmlData = `<dsXml>
            <J_Ui>"ActionName":"TradeWeb", "Option":"InitializeLogin", "Level":1, "RequestFrom":"M"</J_Ui>
            <Sql></Sql>
            <X_Filter> </X_Filter>
            <X_Data></X_Data>
            <X_GFilter />
            <J_Api></J_Api>
        </dsXml>`;

        const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
            headers: {
                'Content-Type': 'application/xml',
                'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
            }
        });

        return response.data.data.rs0[0].CompanyLogo || '';
    }
);

export const commonSlice = createSlice({
    name: 'common',
    initialState,
    reducers: {
        setTableStyle: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
            state.tableStyle = action.payload;
        },
        setLastTradingDate: (state, action: PayloadAction<string>) => {
            state.lastTradingDate = action.payload;
        },
        setCompanyLogo: (state, action: PayloadAction<string>) => {
            state.companyLogo = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle fetchLastTradingDate
            .addCase(fetchLastTradingDate.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchLastTradingDate.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.lastTradingDate = action.payload;
            })
            .addCase(fetchLastTradingDate.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch last trading date';
            })

            // Handle initializeLogin
            .addCase(initializeLogin.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(initializeLogin.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.companyLogo = action.payload;
            })
            .addCase(initializeLogin.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to initialize login';
            });
    },
});

export const { setTableStyle, setLastTradingDate, setCompanyLogo } = commonSlice.actions;
export default commonSlice.reducer; 