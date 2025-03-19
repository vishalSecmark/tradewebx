import { configureStore } from '@reduxjs/toolkit';
import menuReducer from './features/menuSlice';
import commonReducer from './features/common/commonSlice';

export const store = configureStore({
    reducer: {
        menu: menuReducer,
        common: commonReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 