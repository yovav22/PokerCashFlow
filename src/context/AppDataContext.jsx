import * as React from 'react';
import { Player, Session, Transaction, Group } from '@/api/entities';
import { getCurrentGroup } from '@/utils/groupStorage';

const { createContext, useContext, useReducer, useCallback, useEffect } = React;

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DATA: 'SET_DATA',
  UPDATE_SESSION: 'UPDATE_SESSION',
  ADD_SESSION: 'ADD_SESSION',
  DELETE_SESSION: 'DELETE_SESSION',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  ADD_PLAYER: 'ADD_PLAYER',
  DELETE_PLAYER: 'DELETE_PLAYER',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  UPDATE_GROUP: 'UPDATE_GROUP',
  ADD_GROUP: 'ADD_GROUP',
  DELETE_GROUP: 'DELETE_GROUP',
  INVALIDATE_CACHE: 'INVALIDATE_CACHE'
};

// Initial state
const initialState = {
  players: [],
  sessions: [],
  transactions: [],
  groups: [],
  loading: false,
  error: null,
  lastUpdated: null,
  cache: new Map()
};

// Reducer function
const appDataReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.SET_DATA:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      };
    
    case ActionTypes.UPDATE_SESSION:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? { ...session, ...action.payload } : session
        ),
        lastUpdated: Date.now()
      };
    
    case ActionTypes.ADD_SESSION:
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        lastUpdated: Date.now()
      };
    
    case ActionTypes.DELETE_SESSION:
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
        transactions: state.transactions.filter(transaction => transaction.session_id !== action.payload),
        lastUpdated: Date.now()
      };
    
    case ActionTypes.UPDATE_PLAYER:
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.id ? { ...player, ...action.payload } : player
        ),
        lastUpdated: Date.now()
      };
    
    case ActionTypes.ADD_PLAYER:
      return {
        ...state,
        players: [...state.players, action.payload],
        lastUpdated: Date.now()
      };
    
    case ActionTypes.DELETE_PLAYER:
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.payload),
        lastUpdated: Date.now()
      };
    
    case ActionTypes.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
        lastUpdated: Date.now()
      };
    
    case ActionTypes.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(transaction => transaction.id !== action.payload),
        lastUpdated: Date.now()
      };
    
    case ActionTypes.UPDATE_GROUP:
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.id ? { ...group, ...action.payload } : group
        ),
        lastUpdated: Date.now()
      };
    
    case ActionTypes.ADD_GROUP:
      return {
        ...state,
        groups: [...state.groups, action.payload],
        lastUpdated: Date.now()
      };
    
    case ActionTypes.DELETE_GROUP:
      return {
        ...state,
        groups: state.groups.filter(group => group.id !== action.payload),
        lastUpdated: Date.now()
      };
    
    case ActionTypes.INVALIDATE_CACHE:
      return {
        ...state,
        cache: new Map(),
        lastUpdated: Date.now()
      };
    
    default:
      return state;
  }
};

// Create context
const AppDataContext = createContext();

// Custom hook to use the context
export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

// Provider component
export const AppDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appDataReducer, initialState);

  // Cache management
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const isCacheValid = useCallback((key) => {
    const cached = state.cache.get(key);
    return cached && (Date.now() - cached.timestamp < CACHE_DURATION);
  }, [state.cache]);

  const getCachedData = useCallback((key) => {
    if (isCacheValid(key)) {
      return state.cache.get(key).data;
    }
    return null;
  }, [isCacheValid, state.cache]);

  const setCachedData = useCallback((key, data) => {
    const newCache = new Map(state.cache);
    newCache.set(key, { data, timestamp: Date.now() });
    dispatch({ type: ActionTypes.SET_DATA, payload: { cache: newCache } });
  }, [state.cache]);

  // Fetch all data
  const fetchAllData = useCallback(async (force = false) => {
    const cacheKey = 'allData';
    
    if (!force) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        dispatch({ type: ActionTypes.SET_DATA, payload: cached });
        return cached;
      }
    }

    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const [players, sessions, transactions, groups] = await Promise.all([
        Player.list(),
        Session.list(),
        Transaction.list(),
        Group.list()
      ]);

      console.log('🔍 API Data received:', { 
        players: players?.length, 
        sessions: sessions?.length, 
        transactions: transactions?.length, 
        groups: groups?.length 
      });

      const data = { players, sessions, transactions, groups };
      setCachedData(cacheKey, data);
      dispatch({ type: ActionTypes.SET_DATA, payload: data });
      
      return data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [getCachedData, setCachedData]);

  // Session operations
  const createSession = useCallback(async (sessionData) => {
    try {
      const newSession = await Session.create(sessionData);
      dispatch({ type: ActionTypes.ADD_SESSION, payload: newSession });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return newSession;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const updateSession = useCallback(async (sessionId, updates) => {
    try {
      const updatedSession = await Session.update(sessionId, updates);
      dispatch({ type: ActionTypes.UPDATE_SESSION, payload: { id: sessionId, ...updates } });
      
      // Special handling for session completion
      if (updates.status === 'completed') {
        dispatch({ type: ActionTypes.INVALIDATE_CACHE });
        setTimeout(() => fetchAllData(true), 100); // Refresh all data
      }
      
      return updatedSession;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [fetchAllData]);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await Session.delete(sessionId);
      dispatch({ type: ActionTypes.DELETE_SESSION, payload: sessionId });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return true;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Transaction operations
  const createTransaction = useCallback(async (transactionData) => {
    try {
      const newTransaction = await Transaction.create(transactionData);
      dispatch({ type: ActionTypes.ADD_TRANSACTION, payload: newTransaction });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return newTransaction;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const deleteTransaction = useCallback(async (transactionId) => {
    try {
      await Transaction.delete(transactionId);
      dispatch({ type: ActionTypes.DELETE_TRANSACTION, payload: transactionId });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return true;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Player operations
  const createPlayer = useCallback(async (playerData) => {
    try {
      const newPlayer = await Player.create(playerData);
      dispatch({ type: ActionTypes.ADD_PLAYER, payload: newPlayer });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return newPlayer;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const updatePlayer = useCallback(async (playerId, updates) => {
    try {
      const updatedPlayer = await Player.update(playerId, updates);
      dispatch({ type: ActionTypes.UPDATE_PLAYER, payload: { id: playerId, ...updates } });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return updatedPlayer;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const deletePlayer = useCallback(async (playerId) => {
    try {
      await Player.delete(playerId);
      dispatch({ type: ActionTypes.DELETE_PLAYER, payload: playerId });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return true;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Group operations
  const createGroup = useCallback(async (groupData) => {
    try {
      const newGroup = await Group.create(groupData);
      dispatch({ type: ActionTypes.ADD_GROUP, payload: newGroup });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return newGroup;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const updateGroup = useCallback(async (groupId, updates) => {
    try {
      const updatedGroup = await Group.update(groupId, updates);
      dispatch({ type: ActionTypes.UPDATE_GROUP, payload: { id: groupId, ...updates } });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return updatedGroup;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const deleteGroup = useCallback(async (groupId) => {
    try {
      await Group.delete(groupId);
      dispatch({ type: ActionTypes.DELETE_GROUP, payload: groupId });
      dispatch({ type: ActionTypes.INVALIDATE_CACHE });
      return true;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Get group-specific data
  const getGroupData = useCallback((groupId = null) => {
    const currentGroupId = groupId || getCurrentGroup()?.id;
    if (!currentGroupId) return null;

    const groupSessions = state.sessions.filter(s => s.group_id === currentGroupId);
    const groupTransactions = state.transactions.filter(t => t.group_id === currentGroupId);
    const completedSessions = groupSessions.filter(s => s.status === "completed");
    
    return {
      sessions: groupSessions,
      transactions: groupTransactions,
      completedSessions,
      players: state.players // All players for reference
    };
  }, [state.sessions, state.transactions, state.players]);

  // Initialize data on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Data fetching
    fetchAllData,
    getGroupData,
    
    // Session operations
    createSession,
    updateSession,
    deleteSession,
    
    // Transaction operations
    createTransaction,
    deleteTransaction,
    
    // Player operations
    createPlayer,
    updatePlayer,
    deletePlayer,
    
    // Group operations
    createGroup,
    updateGroup,
    deleteGroup,
    
    // Utility
    invalidateCache: () => dispatch({ type: ActionTypes.INVALIDATE_CACHE })
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};
