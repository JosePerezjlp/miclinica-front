import { configureStore } from "@reduxjs/toolkit";
import { loginReducer } from "../features/Login/Login.reducer";
import { registerReducer } from "../features/Register/Register.reducer";
import { affiliateGroupsReducer } from "../features/AffiliateGroups/AffiliateGroups.reducer";
import groupDetailReducer from "../features/AffiliateGroups/AffiliateGroups.detail.reducer";

export const store = configureStore({
  reducer: {
    login: loginReducer,
    register: registerReducer,
    affiliateGroups: affiliateGroupsReducer,
    groupDetail: groupDetailReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
