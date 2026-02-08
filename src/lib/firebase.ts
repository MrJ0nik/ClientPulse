import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { Dispatch, SetStateAction } from 'react';

// Type definitions for Firestore documents
export interface OpportunityDoc {
  id: string;
  score?: number;
  fit?: number;
  access?: number;
  feasibility?: number;
  urgency?: number;
  impact?: number;
  title?: string;
  summary?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'activated';
  createdAt?: number | string;
  updatedAt?: number | string;
  crm_activated_at?: string;
  crm_status?: string;
  [key: string]: any;
}

export interface AMInboxItem {
  id: string;
  score?: number;
  title?: string;
  summary?: string;
  createdAt?: number | string;
  status?: string;
  [key: string]: any;
}

export interface AccountView {
  id: string;
  name?: string;
  ownerAmId?: string;
  pipelineValue?: number;
  [key: string]: any;
}

export interface ActivationStatusDoc {
  id: string;
  opportunityId?: string;
  crm_status?: string;
  status?: string;
  actionType?: string;
  [key: string]: any;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

/**
 * Subscribe to realtime opportunities for an account manager
 * Updates UI in <2s via Firestore snapshot listeners
 */
export const subscribeToOpportunitiesForAM = (
  tenantId: string,
  accountId: string,
  onUpdate: Dispatch<SetStateAction<OpportunityDoc[]>>,
  onError?: (error: Error) => void
): Unsubscribe => {
  try {
    const opportunitiesRef = collection(
      db,
      `tenants/${tenantId}/accounts/${accountId}/opportunities`
    );
    
    // Real-time listener with automatic updates
    const unsubscribe = onSnapshot(
      opportunitiesRef,
      (snapshot) => {
        const opportunities: OpportunityDoc[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as OpportunityDoc));
        
        // Sort by score descending (high-priority first)
        opportunities.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        onUpdate(opportunities);
        console.log(`✓ Updated ${opportunities.length} opportunities (${tenantId}/${accountId})`);
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to opportunities:', error);
    if (onError) {
      onError(error as Error);
    }
    return () => {};
  }
};

/**
 * Subscribe to AM inbox (read model with high-priority sorting)
 */
export const subscribeToAMInbox = (
  tenantId: string,
  amId: string,
  minScore: number = 0,
  onUpdate: Dispatch<SetStateAction<AMInboxItem[]>>,
  onError?: (error: Error) => void
): Unsubscribe => {
  try {
    const inboxRef = collection(db, `tenants/${tenantId}/amInboxes`);
    
    // Query with status filter
    const q = query(
      inboxRef,
      where('amId', '==', amId),
      where('score', '>=', minScore)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AMInboxItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as AMInboxItem));
        
        // Sort by score then by created_at
        items.sort((a, b) => {
          const scoreDiff = (b.score || 0) - (a.score || 0);
          if (scoreDiff !== 0) return scoreDiff;
          
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        onUpdate(items);
        console.log(`✓ Updated AM inbox: ${items.length} items (minScore=${minScore})`);
      },
      (error) => {
        console.error('AM inbox snapshot error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to AM inbox:', error);
    if (onError) {
      onError(error as Error);
    }
    return () => {};
  }
};

/**
 * Subscribe to account views (dashboards with aggregates)
 */
export const subscribeToAccountViews = (
  tenantId: string,
  amId: string,
  onUpdate: Dispatch<SetStateAction<AccountView[]>>,
  onError?: (error: Error) => void
): Unsubscribe => {
  try {
    const accountsRef = collection(db, `tenants/${tenantId}/accounts`);
    
    // Filter accounts by owner (simple version; production would filter at DB level)
    const unsubscribe = onSnapshot(
      accountsRef,
      (snapshot) => {
        const accounts: AccountView[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as AccountView))
          .filter((acc) => acc.ownerAmId === amId); // Client-side filter
        
        // Sort by pipeline value descending
        accounts.sort((a, b) => (b.pipelineValue || 0) - (a.pipelineValue || 0));
        
        onUpdate(accounts);
        console.log(`✓ Updated account views: ${accounts.length} accounts for AM ${amId}`);
      },
      (error) => {
        console.error('Account views snapshot error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to account views:', error);
    if (onError) {
      onError(error as Error);
    }
    return () => {};
  }
};

/**
 * Subscribe to single opportunity with detailed listening
 */
export const subscribeToOpportunity = (
  tenantId: string,
  accountId: string,
  opportunityId: string,
  onUpdate: Dispatch<SetStateAction<OpportunityDoc | null>>,
  onError?: (error: Error) => void
): Unsubscribe => {
  try {
    const oppRef = collection(
      db,
      `tenants/${tenantId}/accounts/${accountId}/opportunities`
    );
    
    const q = query(oppRef, where('id', '==', opportunityId));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const opportunity: OpportunityDoc = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
          } as OpportunityDoc;
          onUpdate(opportunity);
          console.log(`✓ Updated opportunity ${opportunityId}`);
        }
      },
      (error) => {
        console.error('Opportunity snapshot error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to opportunity:', error);
    if (onError) {
      onError(error as Error);
    }
    return () => {};
  }
};

/**
 * Subscribe to workflow activation status (for CRM activation tracking)
 */
export const subscribeToActivationStatus = (
  tenantId: string,
  accountId: string,
  opportunityId: string,
  onUpdate: Dispatch<SetStateAction<ActivationStatusDoc | null>>,
  onError?: (error: Error) => void
): Unsubscribe => {
  try {
    const oppRef = collection(
      db,
      `tenants/${tenantId}/accounts/${accountId}/opportunities`
    );
    
    const q = query(oppRef, where('id', '==', opportunityId));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const opp = snapshot.docs[0].data();
          const activation: ActivationStatusDoc = {
            id: opportunityId,
            opportunityId: opportunityId,
            crm_status: opp.crm_status || 'pending',
            crm_activated_at: opp.crm_activated_at,
            status: opp.crm_status || 'pending',
          };
          onUpdate(activation);
          console.log(`✓ Activation status updated: ${opp.crm_status}`);
        }
      },
      (error) => {
        console.error('Activation status snapshot error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to activation status:', error);
    if (onError) {
      onError(error as Error);
    }
    return () => {};
  }
};
