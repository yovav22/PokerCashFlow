import { useState, useEffect, useCallback } from 'react';
import { Player, Session, Transaction, Group } from '@/api/entities';

// Cache for API responses to avoid redundant requests
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (endpoint) => endpoint;

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Custom hook for fetching and caching API data
export const useApiData = () => {
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = useCallback(async (force = false) => {
    const cacheKey = getCacheKey('players');
    
    if (!force) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setPlayers(cached);
        return cached;
      }
    }

    try {
      const data = await Player.list();
      setCachedData(cacheKey, data);
      setPlayers(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchSessions = useCallback(async (force = false) => {
    const cacheKey = getCacheKey('sessions');
    
    if (!force) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setSessions(cached);
        return cached;
      }
    }

    try {
      const data = await Session.list();
      setCachedData(cacheKey, data);
      setSessions(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchTransactions = useCallback(async (force = false) => {
    const cacheKey = getCacheKey('transactions');
    
    if (!force) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setTransactions(cached);
        return cached;
      }
    }

    try {
      const data = await Transaction.list();
      setCachedData(cacheKey, data);
      setTransactions(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchGroups = useCallback(async (force = false) => {
    const cacheKey = getCacheKey('groups');
    
    if (!force) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setGroups(cached);
        return cached;
      }
    }

    try {
      const data = await Group.list();
      setCachedData(cacheKey, data);
      setGroups(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchAllData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel for better performance
      const [playersData, sessionsData, transactionsData, groupsData] = await Promise.all([
        fetchPlayers(force),
        fetchSessions(force),
        fetchTransactions(force),
        fetchGroups(force)
      ]);

      return {
        players: playersData,
        sessions: sessionsData,
        transactions: transactionsData,
        groups: groupsData
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPlayers, fetchSessions, fetchTransactions, fetchGroups]);

  const invalidateCache = useCallback((keys = []) => {
    if (keys.length === 0) {
      // Clear all cache
      cache.clear();
    } else {
      // Clear specific keys
      keys.forEach(key => cache.delete(getCacheKey(key)));
    }
  }, []);

  const refreshData = useCallback(async (keys = []) => {
    if (keys.length === 0) {
      return await fetchAllData(true);
    }
    
    const promises = [];
    if (keys.includes('players')) promises.push(fetchPlayers(true));
    if (keys.includes('sessions')) promises.push(fetchSessions(true));
    if (keys.includes('transactions')) promises.push(fetchTransactions(true));
    if (keys.includes('groups')) promises.push(fetchGroups(true));
    
    return await Promise.all(promises);
  }, [fetchAllData, fetchPlayers, fetchSessions, fetchTransactions, fetchGroups]);

  return {
    players,
    sessions,
    transactions,
    groups,
    loading,
    error,
    fetchAllData,
    fetchPlayers,
    fetchSessions,
    fetchTransactions,
    fetchGroups,
    invalidateCache,
    refreshData
  };
};

// Hook for group-specific data
export const useGroupData = (groupId) => {
  const { players, sessions, transactions, loading, error, fetchAllData } = useApiData();
  
  const groupData = useMemo(() => {
    if (!groupId || loading) return null;
    
    const groupSessions = sessions.filter(s => s.group_id === groupId);
    const groupTransactions = transactions.filter(t => t.group_id === groupId);
    const completedSessions = groupSessions.filter(s => s.status === "completed");
    
    return {
      sessions: groupSessions,
      transactions: groupTransactions,
      completedSessions,
      players // All players for reference
    };
  }, [groupId, players, sessions, transactions, loading]);

  return {
    groupData,
    loading,
    error,
    fetchAllData
  };
};
