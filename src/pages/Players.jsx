import React, { useState, useEffect } from "react";
import { Player } from "@/api/entities";
import { Session } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { getGroups, getCurrentGroup, setGroups as saveGroups } from "@/utils/groupStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Calendar,
  Award,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LineChart, Line, Legend } from 'recharts';
import { format } from 'date-fns';
import { Switch } from "@/components/ui/switch";
import { BellRing, BellOff } from "lucide-react";
import { Group } from "@/api/entities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <div
          className={`flex items-center mt-1 text-sm ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          {trendValue}
        </div>
      )}
    </CardContent>
  </Card>
);

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [newPlayerPhone, setNewPlayerPhone] = useState("");
  const [newPlayerNotifications, setNewPlayerNotifications] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    topEarner: null,
    mostGames: null,
    highestWinRate: null,
    averageEarnings: 0,
  });
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("statistics");
  const [transactions, setTransactions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    const group = getCurrentGroup();
    const playersIdsInGroup = group ? group.players : [];

    const [fetchedPlayers, fetchedSessions, fetchedTransactions] = await Promise.all([
      Player.list(),
      Session.list(),
      Transaction.list()
    ]);

    const playersInGroup = fetchedPlayers.filter(p => playersIdsInGroup.includes(p.id));
    const groupTransactions = fetchedTransactions.filter(t => t.group_id === group.id);
    const groupSessions = fetchedSessions.filter(s => s.group_id === group.id);
    const completedSessions = groupSessions.filter(s => s.status === "completed");

    // Calculate stats for each player including all metrics
    const playersWithStats = playersInGroup.map((player) => {
      const playerTransactions = groupTransactions.filter(t => t.player_id === player.id);
      const totalBuyIn = playerTransactions
        .filter(t => t.is_buy_in)
        .reduce((sum, t) => sum + t.amount, 0);
      const totalCashOut = playerTransactions
        .filter(t => !t.is_buy_in)
        .reduce((sum, t) => sum + t.amount, 0);
      const totalEarnings = totalCashOut - totalBuyIn;
      const sessionsPlayed = completedSessions.filter(s => s.players.includes(player.id)).length;
      const winRate = totalBuyIn > 0 ? (totalEarnings / totalBuyIn) * 100 : 0;
      const averagePerGame = sessionsPlayed > 0 ? totalEarnings / sessionsPlayed : 0;

      return {
        ...player,
        sessions_played: sessionsPlayed,
        total_buyin: totalBuyIn,
        total_earnings: totalEarnings,
        total_cashout: totalCashOut,
        winRate: winRate,
        averagePerGame: averagePerGame
      };
    });
    
    setPlayers(playersWithStats);
    setTransactions(groupTransactions);
    setSessions(completedSessions);

    // Calculate statistics
    const stats = {
      topEarner: [...playersWithStats].sort((a, b) => b.total_earnings - a.total_earnings)[0] || null,
      mostGames: [...playersWithStats].sort((a, b) => b.sessions_played - a.sessions_played)[0] || null,
      highestWinRate: [...playersWithStats]
        .filter(p => p.total_buyin > 0)
        .sort((a, b) => b.winRate - a.winRate)[0] || null,
      averageEarnings: playersWithStats.reduce((sum, p) => sum + p.total_earnings, 0) / playersWithStats.length || 0
    };
    setStatistics(stats);

    // Prepare performance history data for charts
    const performanceData = playersWithStats
      .filter(player => player.sessions_played > 0) // Only include players who have played games
      .map(player => ({
        name: player.name.split(" ")[0],
        fullName: player.name,
        earnings: player.total_earnings,
        winRate: player.winRate,
        gamesPlayed: player.sessions_played,
        averagePerGame: player.averagePerGame
      }));

    setPerformanceHistory(performanceData);
    setLoading(false);
  };

  // Filter players based on search query
  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.id - b.id);

  // Sort the data for each chart
  const earningsSorted = [...performanceHistory].sort(
    (a, b) => b.earnings - a.earnings
  );
  const avgSorted = [...performanceHistory].sort(
    (a, b) => b.averagePerGame - a.averagePerGame
  );
  const winRateSorted = [...performanceHistory].sort(
    (a, b) => b.winRate - a.winRate
  );

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    // Create the new player
    const newPlayer = await Player.create({
      name: newPlayerName.trim(),
      email: newPlayerEmail.trim() || null,
      phone: newPlayerPhone.trim() || null,
      notifications_enabled: newPlayerNotifications,
      total_games: 0,
      total_earnings: 0,
      total_buyin: 0,
    });

    // Get current group and update its players list
    const currentGroup = getCurrentGroup();
    const groups = getGroups();
    
    if (currentGroup) {
      // Add the new player's ID to the group's players array
      const updatedPlayers = [...(currentGroup.players || []), newPlayer.id];
      
      // Update the group with the new players list
      await Group.update(currentGroup.id, {
        ...currentGroup,
        players: updatedPlayers
      });

      // Update the groups in local storage
      const updatedGroups = groups.map(g => 
        g.id === currentGroup.id 
          ? {...g, players: updatedPlayers}
          : g
      );
      saveGroups(updatedGroups);
    }

    setNewPlayerName("");
    setNewPlayerEmail("");
    setNewPlayerPhone("");
    setNewPlayerNotifications(true);
    setDialogOpen(false);
    setContactDialogOpen(false);
    loadPlayers();
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;

    const allSessions = await Session.list();
    const sessionsWithPlayer = allSessions.filter((session) =>
      session.players.includes(playerToDelete.id)
    );

    const transactions = await Transaction.filter({
      player_id: playerToDelete.id,
    });
    if (transactions.length > 0) {
      alert(
        "Cannot delete player with existing transactions. Remove from all games first."
      );
      setPlayerToDelete(null);
      return;
    }

    if (sessionsWithPlayer.length > 0) {
      alert(
        "Cannot delete player registered in sessions. Remove from all sessions first."
      );
      setPlayerToDelete(null);
      return;
    }

    await Player.delete(playerToDelete.id);
    setPlayerToDelete(null);
    loadPlayers();
  };

  const handleEditPlayer = async (e) => {
    e.preventDefault();
    if (!editingPlayer) return;

    await Player.update(editingPlayer.id, {
      name: editingPlayer.name.trim(),
      email: editingPlayer.email?.trim() || null,
      phone: editingPlayer.phone?.trim() || null,
      notifications_enabled: editingPlayer.notifications_enabled
    });

    setEditingPlayer(null);
    loadPlayers();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent mb-4" />
          <p className="text-xl">Loading players data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-gray-500 mt-1">Track players and contacts</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700"
          onClick={() => {
            setActiveTab("contacts");
            setContactDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Player
        </Button>
      </div>

      <Tabs defaultValue="statistics" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Top Earner"
              value={
                statistics.topEarner
                  ? `₪${statistics.topEarner.total_earnings.toFixed(2)}`
                  : "-"
              }
              icon={Star}
              trend={statistics.topEarner?.total_earnings > 0 ? "up" : "down"}
              trendValue={
                statistics.topEarner
                  ? statistics.topEarner.name.split(" ")[0]
                  : "-"
              }
            />
            <StatCard
              title="Most Active Player"
              value={
                statistics.mostGames
                  ? `${statistics.mostGames.sessions_played} games`
                  : "-"
              }
              icon={Calendar}
              trendValue={
                statistics.mostGames
                  ? statistics.mostGames.name.split(" ")[0]
                  : "-"
              }
            />
            <StatCard
              title="Highest Win Rate"
              value={
                statistics.highestWinRate
                  ? `${(
                      (statistics.highestWinRate.total_earnings /
                        statistics.highestWinRate.total_buyin) *
                      100
                    ).toFixed(1)}%`
                  : "-"
              }
              icon={Award}
              trend="up"
              trendValue={
                statistics.highestWinRate
                  ? statistics.highestWinRate.name.split(" ")[0]
                  : "-"
              }
            />
            <StatCard
              title="Average Earnings"
              value={`₪${Math.round(statistics.averageEarnings).toFixed(2)}`}
              icon={DollarSign}
              trend={statistics.averageEarnings > 0 ? "up" : "down"}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
          {/* Earnings Progression Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Progression</CardTitle>
              <CardDescription>Net profit (or loss) per session per player</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                      label={{ value: "Session Date", position: "insideBottom", offset: -5 }}
                      tick={{ fontSize: 12 }}
                      scale="time"
                    />
                    <YAxis
                      tickFormatter={(value) => `₪${value}`}
                      label={{ value: "Session Net Profit/Loss", angle: -90, position: "insideLeft", offset: -50, dy: 50 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        
                        // Find all session results for this date
                        const hoverDate = new Date(parseInt(label));
                        const sessionResults = players.map(player => {
                          const playerTx = transactions.filter(
                            tx => tx.player_id === player.id && 
                                 tx.group_id === getCurrentGroup().id
                          );
                          
                          const session = sessions.find(
                            s => {
                              const sDate = new Date(s.date);
                              return s.status === "completed" && 
                                    s.group_id === getCurrentGroup().id &&
                                    s.players.includes(player.id) && 
                                    sDate.getFullYear() === hoverDate.getFullYear() &&
                                    sDate.getMonth() === hoverDate.getMonth() &&
                                    sDate.getDate() === hoverDate.getDate();
                            }
                          );

                          if (!session) return null;

                          const sessionTx = playerTx.filter(
                            tx => tx.session_id === session.id
                          );

                          const buyIns = sessionTx
                            .filter(tx => tx.is_buy_in)
                            .reduce((sum, tx) => sum + tx.amount, 0);
                             
                          const cashOuts = sessionTx
                            .filter(tx => !tx.is_buy_in)
                            .reduce((sum, tx) => sum + tx.amount, 0);
                            
                          const sessionNet = cashOuts - buyIns;

                          return {
                            name: player.name,
                            value: sessionNet,
                            color: `hsl(${(players.indexOf(player) * 360) / players.length}, 70%, 50%)`
                          };
                        })
                        .filter(Boolean)
                        .sort((a, b) => b.value - a.value); // Sort by earnings descending
                        
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold mb-2">{format(hoverDate, "MMM d, yyyy")}</p>
                            {sessionResults.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{entry.name}:</span>
                                <span className={`font-semibold ${entry.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₪{Math.round(entry.value).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {players.map((player, index) => {
                      // Get all completed sessions for this player in chronological order
                      const playerSessions = sessions
                        .filter(s => 
                          s.status === "completed" &&
                          s.group_id === getCurrentGroup().id &&
                          s.players.includes(player.id)
                        )
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                      // Calculate cumulative earnings for each session
                      const dataPoints = playerSessions.map(session => {
                        const sessionTx = transactions.filter(tx => 
                          tx.player_id === player.id &&
                          tx.session_id === session.id &&
                          tx.group_id === getCurrentGroup().id
                        );

                        const buyIns = sessionTx
                          .filter(tx => tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);
                          
                        const cashOuts = sessionTx
                          .filter(tx => !tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);

                        const sessionDate = new Date(session.date);
                        // Set the time to noon to avoid timezone issues
                        sessionDate.setHours(12, 0, 0, 0);

                        return {
                          date: sessionDate.getTime(),
                          [player.name]: cashOuts - buyIns
                        };
                      });

                      return dataPoints.length > 0 ? (
                        <Line
                          key={player.id}
                          type="monotone"
                          data={dataPoints}
                          dataKey={player.name}
                          name={player.name}
                          stroke={`hsl(${(index * 360) / players.length}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            fill: `hsl(${(index * 360) / players.length}, 70%, 50%)`
                          }}
                        />
                      ) : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Accumulative Earnings Progression Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Accumulative Earnings Progression</CardTitle>
              <CardDescription>Total accumulated earnings over time per player</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                      label={{ value: "Session Date", position: "insideBottom", offset: -5 }}
                      tick={{ fontSize: 12 }}
                      scale="time"
                    />
                    <YAxis
                      tickFormatter={(value) => `₪${value}`}
                      label={{ value: "Total Accumulated Earnings", angle: -90, position: "insideLeft", offset: -50, dy: 50 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        
                        const hoverDate = new Date(parseInt(label));
                        
                        // Find accumulated earnings for all players at this date point
                        const accumulatedResults = players.map(player => {
                          // Get all completed sessions for this player up to this date
                          const playerSessions = sessions
                            .filter(s => 
                              s.status === "completed" &&
                              s.group_id === getCurrentGroup().id &&
                              s.players.includes(player.id) &&
                              new Date(s.date) <= hoverDate
                            )
                            .sort((a, b) => new Date(a.date) - new Date(b.date));
                          
                          if (playerSessions.length === 0) return null;
                          
                          // Calculate accumulated earnings up to this date
                          let accumulated = 0;
                          playerSessions.forEach(session => {
                            const sessionTx = transactions.filter(tx => 
                              tx.player_id === player.id &&
                              tx.session_id === session.id &&
                              tx.group_id === getCurrentGroup().id
                            );
                            
                            const buyIns = sessionTx
                              .filter(tx => tx.is_buy_in)
                              .reduce((sum, tx) => sum + tx.amount, 0);
                              
                            const cashOuts = sessionTx
                              .filter(tx => !tx.is_buy_in)
                              .reduce((sum, tx) => sum + tx.amount, 0);
                            
                            accumulated += (cashOuts - buyIns);
                          });
                          
                          return {
                            name: player.name,
                            value: accumulated,
                            color: `hsl(${(players.indexOf(player) * 360) / players.length}, 70%, 50%)`
                          };
                        }).filter(result => result !== null);
                        
                        // Sort by earnings (highest to lowest)
                        accumulatedResults.sort((a, b) => b.value - a.value);
                        
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold mb-2">{format(hoverDate, "MMM d, yyyy")}</p>
                            {accumulatedResults.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{entry.name}:</span>
                                <span className={`font-semibold ${entry.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₪{Math.round(entry.value).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {players.map((player, index) => {
                      // Get all completed sessions for this player in chronological order
                      const playerSessions = sessions
                        .filter(s => 
                          s.status === "completed" &&
                          s.group_id === getCurrentGroup().id &&
                          s.players.includes(player.id)
                        )
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                      let accumulatedEarnings = 0;
                      // Calculate accumulative earnings for each session
                      const dataPoints = playerSessions.map(session => {
                        const sessionTx = transactions.filter(tx => 
                          tx.player_id === player.id &&
                          tx.session_id === session.id &&
                          tx.group_id === getCurrentGroup().id
                        );

                        const buyIns = sessionTx
                          .filter(tx => tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);
                          
                        const cashOuts = sessionTx
                          .filter(tx => !tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);

                        const sessionNet = cashOuts - buyIns;
                        accumulatedEarnings += sessionNet;

                        const sessionDate = new Date(session.date);
                        sessionDate.setHours(12, 0, 0, 0);

                        return {
                          date: sessionDate.getTime(),
                          [player.name]: accumulatedEarnings
                        };
                      });

                      return dataPoints.length > 0 ? (
                        <Line
                          key={player.id}
                          type="monotone"
                          data={dataPoints}
                          dataKey={player.name}
                          name={player.name}
                          stroke={`hsl(${(index * 360) / players.length}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            fill: `hsl(${(index * 360) / players.length}, 70%, 50%)`
                          }}
                        />
                      ) : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Average Money per Game Progression Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Average Money per Game Progression</CardTitle>
              <CardDescription>How average earnings per game evolved over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                      label={{ value: "Session Date", position: "insideBottom", offset: -5 }}
                      tick={{ fontSize: 12 }}
                      scale="time"
                    />
                    <YAxis
                      tickFormatter={(value) => `₪${value}`}
                      label={{ value: "Average per Game", angle: -90, position: "insideLeft", offset: -50, dy: 50 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        
                        const hoverDate = new Date(parseInt(label));
                        
                        // Find average per game for all players at this date point
                        const averageResults = players.map(player => {
                          // Get all completed sessions for this player up to this date
                          const playerSessions = sessions
                            .filter(s => 
                              s.status === "completed" &&
                              s.group_id === getCurrentGroup().id &&
                              s.players.includes(player.id) &&
                              new Date(s.date) <= hoverDate
                            )
                            .sort((a, b) => new Date(a.date) - new Date(b.date));
                          
                          if (playerSessions.length === 0) return null;
                          
                          // Calculate total earnings up to this date
                          let totalEarnings = 0;
                          playerSessions.forEach(session => {
                            const sessionTx = transactions.filter(tx => 
                              tx.player_id === player.id &&
                              tx.session_id === session.id &&
                              tx.group_id === getCurrentGroup().id
                            );
                            
                            const buyIns = sessionTx
                              .filter(tx => tx.is_buy_in)
                              .reduce((sum, tx) => sum + tx.amount, 0);
                              
                            const cashOuts = sessionTx
                              .filter(tx => !tx.is_buy_in)
                              .reduce((sum, tx) => sum + tx.amount, 0);
                            
                            totalEarnings += (cashOuts - buyIns);
                          });
                          
                          // Calculate average earnings per game
                          const avgPerGame = totalEarnings / playerSessions.length;
                          
                          return {
                            name: player.name,
                            value: avgPerGame,
                            color: `hsl(${(players.indexOf(player) * 360) / players.length}, 70%, 50%)`
                          };
                        }).filter(result => result !== null);
                        
                        // Sort by earnings (highest to lowest)
                        averageResults.sort((a, b) => b.value - a.value);
                        
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold mb-2">{format(hoverDate, "MMM d, yyyy")}</p>
                            {averageResults.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{entry.name}:</span>
                                <span className={`font-semibold ${entry.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₪{Math.round(entry.value).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {players.map((player, index) => {
                      // Get all completed sessions for this player in chronological order
                      const playerSessions = sessions
                        .filter(s => 
                          s.status === "completed" &&
                          s.group_id === getCurrentGroup().id &&
                          s.players.includes(player.id)
                        )
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                      let totalEarnings = 0;
                      let gamesPlayed = 0;
                      
                      // Calculate average earnings per game for each session point
                      const dataPoints = playerSessions.map(session => {
                        const sessionTx = transactions.filter(tx => 
                          tx.player_id === player.id &&
                          tx.session_id === session.id &&
                          tx.group_id === getCurrentGroup().id
                        );

                        const buyIns = sessionTx
                          .filter(tx => tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);
                          
                        const cashOuts = sessionTx
                          .filter(tx => !tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);

                        const sessionNet = cashOuts - buyIns;
                        totalEarnings += sessionNet;
                        gamesPlayed++;

                        const sessionDate = new Date(session.date);
                        sessionDate.setHours(12, 0, 0, 0);

                        return {
                          date: sessionDate.getTime(),
                          [player.name]: totalEarnings / gamesPlayed
                        };
                      });

                      return dataPoints.length > 0 ? (
                        <Line
                          key={player.id}
                          type="monotone"
                          data={dataPoints}
                          dataKey={player.name}
                          name={player.name}
                          stroke={`hsl(${(index * 360) / players.length}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            fill: `hsl(${(index * 360) / players.length}, 70%, 50%)`
                          }}
                        />
                      ) : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Win Rate Percentage Progression Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Win Rate Percentage Progression</CardTitle>
              <CardDescription>How win rate evolved over time per player</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                      label={{ value: "Session Date", position: "insideBottom", offset: -5 }}
                      tick={{ fontSize: 12 }}
                      scale="time"
                    />
                    <YAxis
                      tickFormatter={(value) => `${value}%`}
                      label={{ value: "Win Rate Percentage", angle: -90, position: "insideLeft", offset: -50, dy: 50 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        
                        const hoverDate = new Date(parseInt(label));
                        
                        // Find win rate for all players at this date point
                        const winRateResults = players.map(player => {
                          // Get all completed sessions for this player up to this date
                          const playerSessions = sessions
                            .filter(s => 
                              s.status === "completed" &&
                              s.group_id === getCurrentGroup().id &&
                              s.players.includes(player.id) &&
                              new Date(s.date) <= hoverDate
                            )
                            .sort((a, b) => new Date(a.date) - new Date(b.date));
                          
                          if (playerSessions.length === 0) return null;
                          
                          // Calculate total buyins and earnings up to this date
                          let totalBuyIns = 0;
                          let totalEarnings = 0;
                          
                          playerSessions.forEach(session => {
                            const sessionTx = transactions.filter(tx => 
                              tx.player_id === player.id &&
                              tx.session_id === session.id &&
                              tx.group_id === getCurrentGroup().id
                            );
                            
                            const buyIns = sessionTx
                              .filter(tx => tx.is_buy_in)
                              .reduce((sum, tx) => sum + tx.amount, 0);
                              
                            const cashOuts = sessionTx
                              .filter(tx => !tx.is_buy_in)
                              .reduce((sum, tx) => sum + tx.amount, 0);
                            
                            totalBuyIns += buyIns;
                            totalEarnings += (cashOuts - buyIns);
                          });
                          
                          // Calculate win rate percentage
                          const winRate = totalBuyIns > 0 ? (totalEarnings / totalBuyIns) * 100 : 0;
                          
                          return {
                            name: player.name,
                            value: winRate,
                            color: `hsl(${(players.indexOf(player) * 360) / players.length}, 70%, 50%)`
                          };
                        }).filter(result => result !== null);
                        
                        // Sort by win rate (highest to lowest)
                        winRateResults.sort((a, b) => b.value - a.value);
                        
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold mb-2">{format(hoverDate, "MMM d, yyyy")}</p>
                            {winRateResults.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{entry.name}:</span>
                                <span className={`font-semibold ${entry.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {entry.value.toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {players.map((player, index) => {
                      // Get all completed sessions for this player in chronological order
                      const playerSessions = sessions
                        .filter(s => 
                          s.status === "completed" &&
                          s.group_id === getCurrentGroup().id &&
                          s.players.includes(player.id)
                        )
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                      let totalBuyIns = 0;
                      let totalEarnings = 0;
                      
                      // Calculate win rate for each session point
                      const dataPoints = playerSessions.map(session => {
                        const sessionTx = transactions.filter(tx => 
                          tx.player_id === player.id &&
                          tx.session_id === session.id &&
                          tx.group_id === getCurrentGroup().id
                        );

                        const buyIns = sessionTx
                          .filter(tx => tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);
                          
                        const cashOuts = sessionTx
                          .filter(tx => !tx.is_buy_in)
                          .reduce((sum, tx) => sum + tx.amount, 0);

                        const sessionNet = cashOuts - buyIns;
                        totalBuyIns += buyIns;
                        totalEarnings += sessionNet;

                        const winRate = totalBuyIns > 0 ? (totalEarnings / totalBuyIns) * 100 : 0;

                        const sessionDate = new Date(session.date);
                        sessionDate.setHours(12, 0, 0, 0);

                        return {
                          date: sessionDate.getTime(),
                          [player.name]: winRate
                        };
                      });

                      return dataPoints.length > 0 ? (
                        <Line
                          key={player.id}
                          type="monotone"
                          data={dataPoints}
                          dataKey={player.name}
                          name={player.name}
                          stroke={`hsl(${(index * 360) / players.length}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            fill: `hsl(${(index * 360) / players.length}, 70%, 50%)`
                          }}
                        />
                      ) : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

            {/* Total Earnings Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Total Earnings Comparison</CardTitle>
                <CardDescription>Player earnings breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={earningsSorted}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value) => `₪${Math.round(value)}`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <Tooltip
                        formatter={(value) => [`₪${Math.round(value)}`, "Earnings"]}
                        labelFormatter={(value) =>
                          earningsSorted.find((item) => item.name === value)
                            ?.fullName || value
                        }
                      />
                      <Bar dataKey="earnings" fill="#10b981" name="Earnings">
                        {earningsSorted.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.earnings >= 0 ? "#10b981" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Average Money per Game */}
            <Card>
              <CardHeader>
                <CardTitle>Average Money per Game</CardTitle>
                <CardDescription>Performance metrics comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={avgSorted}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value) => `₪${Math.round(value)}`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <Tooltip
                        formatter={(value) => [`₪${Math.round(value)}`, "Avg/Game"]}
                        labelFormatter={(value) =>
                          avgSorted.find((item) => item.name === value)?.fullName ||
                          value
                        }
                      />
                      <Bar dataKey="averagePerGame" name="Average per Game">
                        {avgSorted.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              parseFloat(entry.averagePerGame) >= 0
                                ? "#10b981"
                                : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Win Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Win Rate Percentage</CardTitle>
                <CardDescription>Performance metrics comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={winRateSorted}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value) => `${Math.round(value)}%`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <Tooltip
                        formatter={(value) => [`${Math.round(value)}%`, "Win Rate"]}
                        labelFormatter={(value) =>
                          winRateSorted.find((item) => item.name === value)
                            ?.fullName || value
                        }
                      />
                      <Bar dataKey="winRate" name="Win Rate">
                        {winRateSorted.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              parseFloat(entry.winRate) >= 0
                                ? "#10b981"
                                : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Rankings Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Player Rankings</CardTitle>
                <div className="flex items-center gap-2 max-w-sm">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Games</TableHead>
                    <TableHead>Total Buy-in</TableHead>
                    <TableHead>Total Cash-out</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Avg per Game</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No player data available yet. Start a game session to see player rankings.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers
                      .map(player => {
                        // Calculate player's transactions for this group
                        const playerTransactions = transactions.filter(t => 
                          t.player_id === player.id && 
                          t.group_id === getCurrentGroup().id
                        );
                        
                        const totalBuyIn = playerTransactions
                          .filter(t => t.is_buy_in)
                          .reduce((sum, t) => sum + t.amount, 0);
                          
                        const totalCashOut = playerTransactions
                          .filter(t => !t.is_buy_in)
                          .reduce((sum, t) => sum + t.amount, 0);
                          
                        const totalEarnings = totalCashOut - totalBuyIn;
                        
                        // Calculate games played in this group
                        const gamesPlayed = sessions
                          .filter(s => 
                            s.group_id === getCurrentGroup().id && 
                            s.status === "completed" &&
                            s.players.includes(player.id)
                          ).length;

                        return {
                          ...player,
                          gamesPlayed,
                          totalBuyIn,
                          totalCashOut,
                          totalEarnings,
                          avgPerGame: gamesPlayed ? totalEarnings / gamesPlayed : 0,
                          winRate: totalBuyIn ? (totalEarnings / totalBuyIn) * 100 : 0
                        };
                      })
                      .sort((a, b) => b.totalEarnings - a.totalEarnings)
                      .map((player, index) => (
                        <TableRow 
                          key={player.id}
                          className={
                            player.totalEarnings > 0
                              ? "bg-green-50 hover:bg-green-100"
                              : player.totalEarnings < 0
                              ? "bg-red-50 hover:bg-red-100"
                              : ""
                          }
                        >
                          <TableCell>
                            {index === 0 ? (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Award className="w-3 h-3 mr-1" /> 1st
                              </Badge>
                            ) : index === 1 ? (
                              <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                2nd
                              </Badge>
                            ) : index === 2 ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                3rd
                              </Badge>
                            ) : (
                              `${index + 1}th`
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback
                                  className={
                                    player.totalEarnings >= 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {player.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {player.name}
                            </div>
                          </TableCell>
                          <TableCell>{player.gamesPlayed}</TableCell>
                          <TableCell>₪{player.totalBuyIn}</TableCell>
                          <TableCell>₪{player.totalCashOut}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {player.totalEarnings >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              <Badge
                                variant={
                                  player.totalEarnings >= 0 ? "success" : "destructive"
                                }
                              >
                                ₪{player.totalEarnings.toFixed(2)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                player.gamesPlayed === 0
                                  ? "bg-gray-100"
                                  : player.totalEarnings >= 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {player.gamesPlayed > 0 && player.totalBuyIn > 0
                                ? `${player.winRate.toFixed(1)}%`
                                : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {player.gamesPlayed > 0 ? (
                              <Badge
                                variant="outline"
                                className={
                                  player.avgPerGame >= 0
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                ₪{player.avgPerGame.toFixed(2)}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Player Contacts</CardTitle>
                <div className="flex items-center gap-2 max-w-sm">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Notifications</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.email || "-"}</TableCell>
                      <TableCell>{player.phone || "-"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={player.notifications_enabled !== false}
                            onCheckedChange={async (checked) => {
                              try {
                                await Player.update(player.id, {
                                  ...player,
                                  notifications_enabled: checked
                                });
                                loadPlayers();
                              } catch (error) {
                                console.error("Error updating notifications setting:", error);
                              }
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingPlayer(player)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setPlayerToDelete(player)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setContactDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Player
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Player Dialog */}
      <Dialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
                placeholder="player@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (with country code)</Label>
              <Input
                id="phone"
                value={newPlayerPhone}
                onChange={(e) => setNewPlayerPhone(e.target.value)}
                placeholder="+972 54-123-4567"
              />
              <p className="text-xs text-gray-500">Include country code (e.g., +972 for Israel)</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={newPlayerNotifications}
                onCheckedChange={setNewPlayerNotifications}
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="notifications" className="flex items-center cursor-pointer">
                {newPlayerNotifications ? (
                  <>
                    <BellRing className="w-4 h-4 mr-2 text-green-600" />
                    Enable notifications
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2 text-gray-400" />
                    Notifications disabled
                  </>
                )}
              </Label>
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              Add Player
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog
        open={!!editingPlayer}
        onOpenChange={(open) => !open && setEditingPlayer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPlayer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="edit-name"
                value={editingPlayer?.name || ""}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    name: e.target.value,
                  })
                }
                placeholder="Enter player's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingPlayer?.email || ""}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    email: e.target.value,
                  })
                }
                placeholder="player@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number (with country code)</Label>
              <Input
                id="edit-phone"
                value={editingPlayer?.phone || ""}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    phone: e.target.value,
                  })
                }
                placeholder="+972 54-123-4567"
              />
              <p className="text-xs text-gray-500">Include country code (e.g., +972 for Israel)</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-notifications"
                checked={editingPlayer?.notifications_enabled !== false}
                onCheckedChange={(checked) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    notifications_enabled: checked,
                  })
                }
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="edit-notifications" className="flex items-center cursor-pointer">
                {editingPlayer?.notifications_enabled !== false ? (
                  <>
                    <BellRing className="w-4 h-4 mr-2 text-green-600" />
                    Enable notifications
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2 text-gray-400" />
                    Notifications disabled
                  </>
                )}
              </Label>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPlayer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!playerToDelete}
        onOpenChange={(open) => !open && setPlayerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {playerToDelete?.name}? This
              action cannot be undone. The player must be removed from all games
              first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlayer}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
