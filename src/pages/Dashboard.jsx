import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { Player } from "@/api/entities";
import { Session } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Dices,
  Wallet,
  PiggyBank,
  Award,
  ArrowRight,
  ExternalLink,
  Medal,
  Trophy,
  Crown,
  Share,
} from "lucide-react";
import LastSessionStats from "../components/dashboard/LastSessionStats";
import { getCurrentGroup } from "@/utils/groupStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalGames: 0,
    totalPlayers: 0,
    totalMoneyPlayed: 0,
    averageBuyIn: 0,
    totalProfitLoss: 0,
    highestSession: { amount: 0, player: null, date: null },
    topEarner: null,
    biggestLoser: null,
    mostActive: null,
    playerRetentionRate: 0,
  });
  const [lastSession, setLastSession] = useState(null);
  const [lastSessionTransactions, setLastSessionTransactions] = useState([]);
  const [groupPlayers, setGroupPlayers] = useState([]);
  const [groupTransactions, setGroupTransactions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const lastSessionRef = useRef(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState("");
  const [showLeaderboardShareDialog, setShowLeaderboardShareDialog] = useState(false);
  const [downloadedLeaderboardFileName, setDownloadedLeaderboardFileName] = useState("");
  const leaderboardRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const group = getCurrentGroup();
    const players = await Player.list();
    setAllPlayers(players);

    const transactions = await Transaction.list();
    const groupTransactions = transactions.filter(t => t.group_id === group.id);
    setRecentTransactions(groupTransactions);

    const sessions = await Session.list();
    const groupSessions = sessions.filter(s => s.group_id === group.id);
    const completedSessions = groupSessions.filter((s) => s.status === "completed");

    // Get all players in this group
    const groupPlayers = players.filter(p => group.players.includes(p.id));
    
    // Calculate stats only for players who have played in this group
    const activePlayers = groupPlayers.filter(p => {
      const playerTransactions = groupTransactions.filter(t => t.player_id === p.id);
      return playerTransactions.length > 0;
    });
    
    const playersWithStats = activePlayers.map((player) => {
      // Calculate player's transactions for this group
      const playerTransactions = groupTransactions.filter(t => t.player_id === player.id);
      const totalBuyIn = playerTransactions
        .filter(t => t.is_buy_in)
        .reduce((sum, t) => sum + t.amount, 0);
      const totalCashOut = playerTransactions
        .filter(t => !t.is_buy_in)
        .reduce((sum, t) => sum + t.amount, 0);
      const totalEarnings = totalCashOut - totalBuyIn;
      
      // Calculate sessions played in this group
      const sessionsPlayed = completedSessions.filter((session) =>
        session.players.includes(player.id)
      ).length;

      return {
        ...player,
        sessions_played: sessionsPlayed,
        total_buyin: totalBuyIn,
        total_earnings: totalEarnings
      };
    });

    // Sort players by earnings for the leaderboard
    const sortedPlayers = [...playersWithStats].sort((a, b) => b.total_earnings - a.total_earnings);
    setTopPlayers(sortedPlayers);

    // Calculate total money played in the group
    const totalMoneyPlayed = groupTransactions
      .filter(t => t.is_buy_in)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate player retention rate
    const playerRetentionRate = (() => {
      if (completedSessions.length <= 1) return 0;
      
      let totalReturnRate = 0;
      let playerCount = 0;

      groupPlayers.forEach(player => {
        const sessionsPlayed = completedSessions.filter(s => s.players.includes(player.id)).length;
        if (sessionsPlayed > 0) {
          const returnRate = (sessionsPlayed / completedSessions.length) * 100;
          totalReturnRate += returnRate;
          playerCount++;
        }
      });

      return playerCount > 0 ? totalReturnRate / playerCount : 0;
    })();

    // Find the highest profit in a single session
    const sessionProfits = completedSessions.map(session => {
      const sessionTransactions = groupTransactions.filter(t => t.session_id === session.id);
      const players = new Map();

      sessionTransactions.forEach(transaction => {
        if (!players.has(transaction.player_id)) {
          players.set(transaction.player_id, {
            buyIn: 0,
            cashOut: 0
          });
        }
        const playerStats = players.get(transaction.player_id);
        if (transaction.is_buy_in) {
          playerStats.buyIn += transaction.amount;
        } else {
          playerStats.cashOut += transaction.amount;
        }
      });

      let maxProfit = 0;
      let maxProfitPlayer = null;
      players.forEach((stats, playerId) => {
        const profit = stats.cashOut - stats.buyIn;
        if (profit > maxProfit) {
          maxProfit = profit;
          maxProfitPlayer = playersWithStats.find(p => p.id === playerId);
        }
      });

      return {
        amount: maxProfit,
        player: maxProfitPlayer,
        date: session.date
      };
    });

    const highestSession = sessionProfits.reduce((max, current) => 
      current.amount > max.amount ? current : max, 
      { amount: 0, player: null, date: null }
    );

    // Reset statistics with group-specific data
    setStatistics({
      totalGames: completedSessions.length,
      totalPlayers: groupPlayers.length,
      totalMoneyPlayed,
      averageBuyIn: activePlayers.length > 0 ? totalMoneyPlayed / activePlayers.length : 0,
      highestSession,
      topEarner: sortedPlayers[0] || null,
      biggestLoser: [...sortedPlayers].sort((a, b) => a.total_earnings - b.total_earnings)[0] || null,
      mostActive: [...playersWithStats].sort((a, b) => b.sessions_played - a.sessions_played)[0] || null,
      playerRetentionRate
    });

    // Find last completed session and its transactions
    const lastCompletedSession = [...groupSessions]
      .filter(s => s.status === "completed")
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (lastCompletedSession) {
      setLastSession(lastCompletedSession);
      const lastSessionTransactions = groupTransactions.filter(t => 
        t.session_id === lastCompletedSession.id
      );
      
      // Calculate player results for the last session
      const playerResults = new Map();
      lastSessionTransactions.forEach(transaction => {
        if (!playerResults.has(transaction.player_id)) {
          playerResults.set(transaction.player_id, {
            buyIn: 0,
            cashOut: 0
          });
        }
        const stats = playerResults.get(transaction.player_id);
        if (transaction.is_buy_in) {
          stats.buyIn += transaction.amount;
        } else {
          stats.cashOut += transaction.amount;
        }
      });

      // Convert to array and calculate profits
      const sessionResults = Array.from(playerResults.entries()).map(([playerId, stats]) => {
        const player = players.find(p => p.id === playerId);
        return {
          player,
          buyIn: stats.buyIn,
          cashOut: stats.cashOut,
          profit: stats.cashOut - stats.buyIn
        };
      }).sort((a, b) => b.profit - a.profit);

      setLastSessionTransactions(sessionResults);
    } else {
      setLastSession(null);
      setLastSessionTransactions([]);
    }

    setGroupPlayers(groupPlayers);
    setGroupTransactions(groupTransactions);
    setCompletedSessions(completedSessions);
  };

  const shareLastSession = async () => {
    if (!lastSessionRef.current || !lastSession) {
      alert("No completed session available to share.");
      return;
    }

    try {
      const canvas = await html2canvas(lastSessionRef.current, {
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      const fileName = `poker-session-${format(new Date(lastSession.date), "MMM-d-yyyy")}.jpg`;
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadedFileName(fileName);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share the session results. Please try again.');
    }
  };

  const openWhatsApp = () => {
    const messageText = `Last completed poker session from ${format(new Date(lastSession.date), "MMMM d, yyyy")}`;
    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    setShowShareDialog(false);
  };

  const shareLeaderboard = async () => {
    if (!leaderboardRef.current || groupPlayers.length === 0) {
      alert("No leaderboard data available to share.");
      return;
    }

    try {
      const canvas = await html2canvas(leaderboardRef.current, {
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      const fileName = `poker-leaderboard-${format(new Date(), "MMM-d-yyyy")}.jpg`;
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadedLeaderboardFileName(fileName);
      setShowLeaderboardShareDialog(true);
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share the leaderboard. Please try again.');
    }
  };

  const openWhatsAppForLeaderboard = () => {
    const messageText = `🏆 Poker League Leaderboard - ${format(new Date(), "MMMM d, yyyy")}`;
    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    setShowLeaderboardShareDialog(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Track and analyze poker performance</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("Sessions")}>
            <Button className="bg-red-600 hover:bg-red-700">
              Manage Sessions <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-red-500 rounded-full opacity-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Games
            </CardTitle>
            <Dices className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalGames}</div>
            <div className="flex items-center mt-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Active community
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-blue-500 rounded-full opacity-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Players
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPlayers}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-green-500 rounded-full opacity-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Money Played
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{statistics.totalMoneyPlayed}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-purple-500 rounded-full opacity-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Player Retention Rate
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {statistics.playerRetentionRate.toFixed(1)}%
            </div>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <Users className="w-4 h-4 mr-1" />
              Based on {statistics.totalGames} games
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Session Results with ref */}
      {lastSession && lastSessionTransactions.length > 0 && (
        <div ref={lastSessionRef} className="rounded-lg border bg-white shadow-sm">
          <LastSessionStats
            session={lastSession}
            transactions={lastSessionTransactions}
            onShare={shareLastSession}
          />
        </div>
      )}

      <Card>
        <div ref={leaderboardRef} className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Poker Leaderboard - All-Time Results
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Career performance of top poker players
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
                  <Users className="w-4 h-4" />
                  {topPlayers.length} Players
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-black">
                  <Wallet className="w-4 h-4" />
                  ₪{statistics.totalMoneyPlayed} Played
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-none hover:from-amber-500 hover:to-amber-600"
                  onClick={shareLeaderboard}
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {statistics.topEarner && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Top Earner
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-800">
                            {statistics.topEarner.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {statistics.topEarner.name}
                        </span>
                      </div>
                      <Badge variant="success" className="text-lg">
                        ₪{statistics.topEarner.total_earnings}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {statistics.highestSession && statistics.highestSession.player && statistics.highestSession.amount > 0 && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Max Profit In Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback className="bg-purple-100 text-purple-800">
                            {statistics.highestSession.player?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {statistics.highestSession.player?.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 text-lg">
                        ₪{statistics.highestSession.amount}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {statistics.biggestLoser && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Biggest Loser
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    {statistics.biggestLoser.total_earnings < 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback className="bg-red-100 text-red-800">
                              {statistics.biggestLoser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {statistics.biggestLoser.name}
                          </span>
                        </div>
                        <Badge variant="destructive" className="text-lg">
                          ₪{statistics.biggestLoser.total_earnings}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        No negative earners
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="rounded-md border overflow-hidden">
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
                  {groupPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No player data available yet. Start a game session to see player rankings.
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupPlayers
                      .map(player => {
                        // Calculate player's transactions for this group
                        const playerTransactions = groupTransactions.filter(t => 
                          t.player_id === player.id
                        );
                        
                        const totalBuyIn = playerTransactions
                          .filter(t => t.is_buy_in)
                          .reduce((sum, t) => sum + t.amount, 0);
                          
                        const totalCashOut = playerTransactions
                          .filter(t => !t.is_buy_in)
                          .reduce((sum, t) => sum + t.amount, 0);
                          
                        const totalEarnings = totalCashOut - totalBuyIn;
                        
                        // Calculate games played in this group
                        const gamesPlayed = completedSessions.filter(s => 
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
                      .filter(player => player.gamesPlayed > 0)
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
            </div>
          </CardContent>
        </div>

        <div className="flex justify-center gap-4 pb-4">
          <Link to={createPageUrl("Players")}>
            <Button variant="outline" className="flex items-center gap-2">
              View All Player Statistics <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-500" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No transactions available yet. Start a game session to see transactions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((transaction) => {
                      const player = allPlayers.find(
                        (p) => p.id === transaction.player_id
                      );
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {player ? player.name : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={transaction.is_buy_in 
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"}
                            >
                              {transaction.is_buy_in
                                ? "Buy-in"
                                : "Cash-out"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {!transaction.is_buy_in ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              ₪{transaction.amount}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.created_at ? format(
                              new Date(transaction.created_at.replace('+00:00', '')),
                              "MMM d, HH:mm"
                            ) : "No time"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Link
                to={createPageUrl("Sessions")}
                className="flex items-center justify-center w-full"
              >
                View All Transactions <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share on WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p>The image has been downloaded as: <strong>{downloadedFileName}</strong></p>
            <p className="font-medium">To share on WhatsApp:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the button below to open WhatsApp</li>
              <li>Click the attachment icon (📎) in WhatsApp</li>
              <li>Select the downloaded image from your Downloads folder</li>
              <li>Send the message</li>
            </ol>
            <div className="flex justify-center pt-4">
              <Button 
                onClick={openWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                Open WhatsApp
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaderboardShareDialog} onOpenChange={setShowLeaderboardShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Leaderboard on WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p>The leaderboard image has been downloaded as: <strong>{downloadedLeaderboardFileName}</strong></p>
            <p className="font-medium">To share on WhatsApp:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the button below to open WhatsApp</li>
              <li>Click the attachment icon (📎) in WhatsApp</li>
              <li>Select the downloaded image from your Downloads folder</li>
              <li>Send the message</li>
            </ol>
            <div className="flex justify-center pt-4">
              <Button 
                onClick={openWhatsAppForLeaderboard}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                Open WhatsApp
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}