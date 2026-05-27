import { createSlice } from '@reduxjs/toolkit';
import type { GroupDetailState } from './AffiliateGroups.detail.types';
import {
  getGroupDetailThunk,
  updateGroupInfoThunk,
  addAffiliateThunk,
  updateAffiliateThunk,
  removeAffiliateThunk,
  addPaymentMethodThunk,
  updatePaymentMethodThunk,
  removePaymentMethodThunk,
  updatePlanThunk,
} from './AffiliateGroups.detail.action';

const initialState: GroupDetailState = {
  data: null,
  loading: false,
  error: null,
};

const groupDetailSlice = createSlice({
  name: 'groupDetail',
  initialState,
  reducers: {
    clearGroupDetail: (state) => {
      state.data = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Group Detail
      .addCase(getGroupDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGroupDetailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getGroupDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Update Group Info
      .addCase(updateGroupInfoThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGroupInfoThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateGroupInfoThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Add Affiliate
      .addCase(addAffiliateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAffiliateThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(addAffiliateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Update Affiliate
      .addCase(updateAffiliateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAffiliateThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateAffiliateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Remove Affiliate
      .addCase(removeAffiliateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeAffiliateThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(removeAffiliateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Add Payment Method
      .addCase(addPaymentMethodThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPaymentMethodThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(addPaymentMethodThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Update Payment Method
      .addCase(updatePaymentMethodThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePaymentMethodThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updatePaymentMethodThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Remove Payment Method
      .addCase(removePaymentMethodThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removePaymentMethodThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(removePaymentMethodThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      })

      // Update Plan
      .addCase(updatePlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updatePlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Error desconocido';
      });
  },
});

export const { clearGroupDetail, clearError } = groupDetailSlice.actions;
export default groupDetailSlice.reducer;
