import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CommonState {
    tableStyle: 'small' | 'medium' | 'large';
}

const initialState: CommonState = {
    tableStyle: 'small',
};

export const commonSlice = createSlice({
    name: 'common',
    initialState,
    reducers: {
        setTableStyle: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
            state.tableStyle = action.payload;
        },
    },
});

export const { setTableStyle } = commonSlice.actions;
export default commonSlice.reducer; 