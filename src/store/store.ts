import { configureStore } from "@reduxjs/toolkit";
import { loginReducer } from "../features/Login/Login.reducer";
import { registerReducer } from "../features/Register/Register.reducer";
import { affiliateGroupsReducer } from "../features/AffiliateGroups/AffiliateGroups.reducer";
import { plansReducer } from "../features/Plans/Plans.reducer";
import { promotersReducer } from "../features/Promoters/Promoters.reducer";
import { usersReducer } from "../features/Users/Users.reducer";
import { rolesReducer } from "../features/Roles/Roles.reducer";
import { accessModulesReducer } from "../features/Modules/Modules.reducer";
import groupDetailReducer from "../features/AffiliateGroups/AffiliateGroups.detail.reducer";
import { auditReducer } from "../features/Audit/Audit.reducer";
import { citiesReducer } from "../features/Cities/Cities.reducer";
import { benefitsReducer } from "../features/Benefits/Benefits.reducer";

export const store = configureStore({
  reducer: {
    login: loginReducer,
    register: registerReducer,
    affiliateGroups: affiliateGroupsReducer,
    plans: plansReducer,
    promoters: promotersReducer,
    users: usersReducer,
    roles: rolesReducer,
    accessModules: accessModulesReducer,
    groupDetail: groupDetailReducer,
    audit: auditReducer,
    cities: citiesReducer,
    benefits: benefitsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
