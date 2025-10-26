/**
 * useAccount Hook
 * React hook for managing customer accounts
 */

import { useState, useCallback } from 'react';
import { AlertPreference, AlertContact } from '@/types/visaAlerts';

export interface CustomerProfile {
  viegoUID: string;
  visaUserIdentifier?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  accountStatus: 'active' | 'inactive' | 'suspended';
  preferences?: {
    notifications?: boolean;
    budgetAlerts?: boolean;
  };
  visaAlertDocumentId?: string;
  alertPreferences?: AlertPreference[];
  defaultAlertsPreferences?: AlertContact[];
}

export interface CreateAccountData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  customViegoUID?: string;
}

export interface UseAccountReturn {
  profile: CustomerProfile | null;
  loading: boolean;
  error: string | null;
  createAccount: (data: CreateAccountData) => Promise<CustomerProfile>;
  getAccount: (userIdentifier: string) => Promise<CustomerProfile>;
  checkAccountExists: (userIdentifier: string) => Promise<boolean>;
  clearError: () => void;
}

export function useAccount(): UseAccountReturn {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Create a new account
   */
  const createAccount = useCallback(async (data: CreateAccountData): Promise<CustomerProfile> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      if (!result.success) {
        throw new Error(result.error || 'Account creation failed');
      }

      setProfile(result.profile);
      console.log('✅ Account created:', {
        viegoUID: result.profile.viegoUID,
        visaUserIdentifier: result.profile.visaUserIdentifier,
      });

      return result.profile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      console.error('Account creation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Retrieve an existing account by Viego UID
   */
  const getAccount = useCallback(async (viegoUID: string): Promise<CustomerProfile> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/account?viegoUID=${encodeURIComponent(viegoUID)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve account');
      }

      if (!result.success) {
        throw new Error(result.error || 'Account retrieval failed');
      }

      setProfile(result.profile);
      console.log('✅ Account retrieved:', {
        viegoUID: result.profile.viegoUID,
        hasNotifications: result.notifications && result.notifications.length > 0,
      });

      return result.profile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve account';
      setError(errorMessage);
      console.error('Account retrieval error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if an account exists by Viego UID
   */
  const checkAccountExists = useCallback(async (viegoUID: string): Promise<boolean> => {
    try {
      await getAccount(viegoUID);
      return true;
    } catch (err) {
      return false;
    }
  }, [getAccount]);

  return {
    profile,
    loading,
    error,
    createAccount,
    getAccount,
    checkAccountExists,
    clearError,
  };
}
