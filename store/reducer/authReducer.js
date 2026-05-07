import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    auth: null
}

export const authReducer = createSlice({
    name: 'authStore',
    initialState,
    reducers: {
        login: (state, action) => {
            state.auth = action.payload
        },
        logout: (state) => {
            state.auth = null
        },
        updateSellerProfile: (state, action) => {
            if (state.auth) {
                state.auth.sellerProfile = {
                    ...state.auth.sellerProfile,
                    ...action.payload
                }
            }
        }
    }
})

export const { login, logout, updateSellerProfile } = authReducer.actions
export default authReducer.reducer
