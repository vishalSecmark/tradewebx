import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import type { RootState } from '../store';

const BASE_URL = 'https://trade-plus.in';
const PATH_URL = '/TradeWebAPI/api/main/tradeweb';

// Define types
type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

interface MenuState {
    items: NavItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: MenuState = {
    items: [],
    status: 'idle',
    error: null
};

// Create async thunk for fetching menu
export const fetchMenuItems = createAsyncThunk(
    'menu/fetchMenuItems',
    async () => {
        const userData = {
            UserId: localStorage.getItem('userId') || ''
        };

        const xmlData = `<dsXml>
      <J_Ui>"ActionName":"TradeWeb", "Option":"MOBILEMENU","RequestFrom" :"M"</J_Ui>
      <Sql></Sql>
      <X_Filter>
          <UserId>${userData.UserId}</UserId>
      </X_Filter>
      <J_Api>"UserId":"${userData.UserId}","AccYear":24,"MyDbPrefix":"SVVS","MemberCode":"undefined","SecretKey":"undefined"</J_Api>
    </dsXml>`;

        const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
            headers: {
                'Content-Type': 'application/xml',
                'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
            }
        });

        // Convert API response to NavItems
        const convertToNavItems = (data: any): NavItem[] => {
            return data.map((item: any) => {
                const routeMapping: Record<string, string> = {
                    'Dashboard': 'dashboard',
                    'Reports': 'reports',
                };

                const basePath = `/${routeMapping[item.componentName] || item.componentName.toLowerCase().replace(/\s+/g, '-')}`;

                const navItem: NavItem = {
                    icon: item.icon,
                    name: item.title,
                    path: basePath
                };

                if (item.submenu && item.submenu.length > 0) {
                    navItem.subItems = item.submenu.map((subItem: any) => ({
                        name: subItem.title,
                        path: `${basePath}/${subItem.componentName.toLowerCase().replace(/\s+/g, '-')}`,
                        pro: false
                    }));
                }

                return navItem;
            });
        };

        return convertToNavItems(response.data.data.rs0);
    }
);

// Create slice
const menuSlice = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        // Add any additional reducers if needed
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMenuItems.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchMenuItems.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchMenuItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch menu items';
            });
    },
});

// Export selectors
export const selectAllMenuItems = (state: RootState) => state.menu.items;
export const selectMenuStatus = (state: RootState) => state.menu.status;
export const selectMenuError = (state: RootState) => state.menu.error;

export default menuSlice.reducer; 