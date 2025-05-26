import React, { useState, useEffect } from "react";
import { Session } from "@/api/entities";
import { Player } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentGroup } from "@/utils/groupStorage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { 
  X, 
  Plus, 
  DollarSign, 
  Trash2, 
  MoreHorizontal, 
  Calendar, 
  Edit, 
  Crown,
  Loader2 
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Sessions() {
  const [settings, setSettings] = useState({
    max_players: 7
  });
  const [sessions, setSessions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [selectedSessionForTransaction, setSelectedSessionForTransaction] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionPlayer, setTransactionPlayer] = useState("");
  const [transactionType, setTransactionType] = useState("buy_in");
  const [sessionTransactions, setSessionTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [sessionForSummary, setSessionForSummary] = useState(null);
  const [playerToRegister, setPlayerToRegister] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadData();
      } catch (err) {
        console.error("Error initializing data:", err);
        setError("Failed to initialize data. Please reload the page.");
      }
    };

    initializeData();
  }, [retryAttempt]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sessionsData, playersData, transactionsData] = await Promise.all([
        Session.list(),
        Player.list(),
        Transaction.list()
      ]);

      console.log('Loaded transactions:', transactionsData);

      const group = getCurrentGroup();
      const playersIdsInGroup = group ? group.players : [];
      const playersInGroup = playersData.filter(p => playersIdsInGroup.includes(p.id));
      const sessionsInGroup = sessionsData.filter(s => s.group_id == group.id);
      const transactionsInGroup = transactionsData.filter(t => t.group_id == group.id);

      setSessions(sessionsInGroup);
      setPlayers(playersInGroup);
      setSessionTransactions(transactionsInGroup);
      setDisplayedTransactions(transactionsInGroup);
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    const group = getCurrentGroup();
    const today = new Date();
    const localDate = format(today, 'yyyy-MM-dd');
    
    await Session.create({
      group_id: group.id,
      date: localDate,
      status: "registration",
      max_players: settings.max_players,
      players: []
    });
    loadData();
  };

  const updateSessionHost = async (sessionId, hostId) => {
    if (!sessionId) return;
    await Session.update(sessionId, { host_id: hostId });
    loadData();
  };

  const registerForSession = async (sessionId, playerId) => {
    if (!sessionId || !playerId) return;
    
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const registeredPlayers = session.players || [];

      if (registeredPlayers.includes(playerId)) return;

      if (registeredPlayers.length >= 2 * settings.max_players) {
        alert(`Maximum number of players (${2* settings.max_players}) reached for this session.`);
        return;
      }
      
      const updatedPlayers = [...registeredPlayers, playerId];
      await Session.update(sessionId, {
        players: updatedPlayers
      });

      setPlayerToRegister("");
      loadData();
    } catch (error) {
      console.error("Error registering player:", error);
      alert("Error registering player. Please try again.");
    }
  };

  const removePlayerFromSession = async (sessionId, playerId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedPlayers = session.players.filter(id => id !== playerId);
    await Session.update(sessionId, {
      players: updatedPlayers
    });
    loadData();
  };

  const startSession = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      await Session.update(sessionId, { status: "active" });
      loadData();
    } catch (error) {
      console.error("Error starting session:", error);
      alert("Error starting session. Please try again.");
    }
  };

  const endSession = async (sessionId) => {
    await Session.update(sessionId, { status: "completed" });
    loadData();
  };

  const deleteSession = async (sessionId) => {
    try {
      const sessions = await Session.list();
      const sessionExists = sessions.some(s => s.id === sessionId);

      if (!sessionExists) {
        alert("Session no longer exists. The page will refresh.");
        setSessionToDelete(null);
        loadData();
        return;
      }

      const sessionTransactionsToDelete = sessionTransactions.filter(t => t.session_id === sessionId);

      for (const transaction of sessionTransactionsToDelete) {
        try {
          const player = players.find(p => p.id === transaction.player_id);
          if (player) {
            const updatedData = {
              total_games: player.total_games - (transaction.is_buy_in ? 1 : 0),
              total_buyin: player.total_buyin - (transaction.is_buy_in ? transaction.amount : 0),
              total_earnings: player.total_earnings - (transaction.is_buy_in ? -transaction.amount : transaction.amount)
            };
            await Player.update(player.id, updatedData);
          }
          await Transaction.delete(transaction.id);
        } catch (error) {
          console.error("Error deleting transaction:", error);
        }
      }

      await Session.delete(sessionId);
      setSessionToDelete(null);
      loadData();
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("There was an error deleting the session. Please try again.");
      setSessionToDelete(null);
      loadData();
    }
  };

  const handleEditSession = async (e) => {
    e.preventDefault();
    if (!editingSession) return;

    await Session.update(editingSession.id, {
      date: editingSession.date
    });
    setEditingSession(null);
    loadData();
  };

  const loadSessionTransactions = (sessionId) => {
    if (!sessionId) return;
    const group = getCurrentGroup();
    const filteredTransactions = sessionTransactions.filter(t => 
      t.session_id === sessionId && t.group_id === group.id
    );
    setSessionTransactions(filteredTransactions);
  };

  const handleOpenTransaction = async (session) => {
    setSelectedSessionForTransaction(session);
    setTransactionAmount("");
    setTransactionPlayer("");
    setTransactionType("buy_in");
    // Filter transactions specifically for this session
    const sessionTransactions = (await Transaction.list())
      .filter(t => t.session_id === session.id && t.group_id === getCurrentGroup().id);
    setDisplayedTransactions(sessionTransactions);
  };

  const handleOpenSummary = async (session) => {
    setSessionForSummary(session);
    const relevantTransactions = sessionTransactions.filter(t => t.session_id === session.id);
    setDisplayedTransactions(relevantTransactions);
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!selectedSessionForTransaction || !transactionPlayer || !transactionAmount) return;

    try {
      const amount = parseFloat(transactionAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
      }

      const player = players.find(p => String(p.id) === String(transactionPlayer));
      if (!player) {
        alert("Please select a valid player.");
        return;
      }

      const group = getCurrentGroup();
      const now = new Date();
      const localDateTime = format(now, "yyyy-MM-dd'T'HH:mm:ss'+00:00'");
      
      const newTransaction = await Transaction.create({
        session_id: selectedSessionForTransaction.id,
        group_id: group.id,
        player_id: transactionPlayer,
        is_buy_in: transactionType === "buy_in",
        amount: amount,
        created_at: localDateTime
      });

      const updatedData = {
        total_games: player.total_games + (transactionType === "buy_in" ? 1 : 0),
        total_buyin: player.total_buyin + (transactionType === "buy_in" ? amount : 0),
        total_earnings: player.total_earnings + (transactionType === "buy_in" ? -amount : amount)
      };
      await Player.update(player.id, updatedData);

      // Update transactions without clearing the player selection
      setTransactionAmount("");
      setTransactionType("buy_in");

      // Get all transactions in a single call and update both states
      const allTransactions = await Transaction.list();
      const currentGroupTransactions = allTransactions.filter(t => t.group_id === group.id);
      const currentSessionTransactions = currentGroupTransactions.filter(t => 
        t.session_id === selectedSessionForTransaction.id
      );

      setSessionTransactions(currentGroupTransactions);
      setDisplayedTransactions(currentSessionTransactions);

      // Update other data without fetching transactions again
      const [sessionsData, playersData] = await Promise.all([
        Session.list(),
        Player.list()
      ]);

      const playersIdsInGroup = group ? group.players : [];
      const playersInGroup = playersData.filter(p => playersIdsInGroup.includes(p.id));
      const sessionsInGroup = sessionsData.filter(s => s.group_id === group.id);

      setSessions(sessionsInGroup);
      setPlayers(playersInGroup);

    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating transaction. Please try again.");
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const transaction = sessionTransactions.find(t => t.id === transactionId);
      if (!transaction) return;

      const player = players.find(p => p.id === transaction.player_id);
      if (player) {
        const updatedData = {
          total_games: player.total_games - (transaction.is_buy_in ? 1 : 0),
          total_buyin: player.total_buyin - (transaction.is_buy_in ? transaction.amount : 0),
          total_earnings: player.total_earnings - (transaction.is_buy_in ? -transaction.amount : transaction.amount)
        };
        await Player.update(player.id, updatedData);
      }

      await Transaction.delete(transactionId);

      // Update both transaction states
      setSessionTransactions(sessionTransactions.filter(t => t.id !== transactionId));
      setDisplayedTransactions(displayedTransactions.filter(t => t.id !== transactionId));
      loadData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Error deleting transaction. Please try again.");
    }
  };

  const getSessionStatus = (status) => {
    switch (status) {
      case "registration":
        return <Badge className="bg-yellow-100 text-yellow-800">Registration</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return null;
    }
  };

  const calculatePlayerSummary = (transactions, sessionPlayers) => {
    const summary = {};

    sessionPlayers.forEach(playerId => {
      const player = players.find(p => p.id === playerId);
      if (player) {
        summary[playerId] = {
          player: player,
          totalBuyIn: 0,
          totalCashOut: 0,
          totalProfit: 0,
          transactions: []
        };
      }
    });

    transactions.forEach(transaction => {
      if (!summary[transaction.player_id]) {
        const player = players.find(p => p.id === transaction.player_id);
        if (player) {
          summary[transaction.player_id] = {
            player: player,
            totalBuyIn: 0,
            totalCashOut: 0,
            totalProfit: 0,
            transactions: []
          };
        }
      }

      if (summary[transaction.player_id]) {
        if (transaction.is_buy_in) {
          summary[transaction.player_id].totalBuyIn += transaction.amount;
        } else {
          summary[transaction.player_id].totalCashOut += transaction.amount;
        }
        summary[transaction.player_id].transactions.push(transaction);
      }
    });

    Object.values(summary).forEach(playerSummary => {
      playerSummary.totalProfit = playerSummary.totalCashOut - playerSummary.totalBuyIn;
    });

    return Object.values(summary).sort((a, b) => b.totalProfit - a.totalProfit);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Games</h1>
          <p className="text-gray-500 mt-1">Manage poker sessions and player registrations</p>
        </div>
        <Button
          onClick={createNewSession}
          className="bg-red-600 hover:bg-red-700"
          disabled={sessions.some(s => s.status === "registration") || loading}
        >
          <Plus className="w-4 h-4 mr-2" /> New Session
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <p>{error}</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setRetryAttempt(prev => prev + 1);
                }}
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <p className="ml-2 text-lg text-gray-600">Loading sessions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle>{session.date ? format(new Date(session.date), "MMMM d, yyyy") : "No date"}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Crown className="w-4 h-4 text-amber-500" />
                        {session.status === "registration" ? (
                          <Select
                            value={session.host || ""}
                            onValueChange={(value) => updateSessionHost(session.id, value)}
                          >
                            <SelectTrigger className="h-7 text-sm">
                              <SelectValue placeholder="Select host" />
                            </SelectTrigger>
                            <SelectContent>
                              {players.map(player => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-gray-600">
                            Host: {players.find(p => p.id === session.host)?.name || "Not assigned"}
                          </span>
                        )}
                      </div>
                      <CardDescription>
                        {session.players?.length || 0} / {settings.max_players} players
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSessionStatus(session.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSession(session)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Date
                        </DropdownMenuItem>
                        {session.status === "registration" && (
                          <DropdownMenuItem 
                            onClick={() => startSession(session.id)}
                            disabled={(session.players?.length || 0) < 2}
                          >
                            Start Session
                          </DropdownMenuItem>
                        )}
                        {session.status === "active" && (
                          <DropdownMenuItem onClick={() => endSession(session.id)}>
                            Complete Session
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setSessionToDelete(session)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Session
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleOpenSummary(session)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          All Transactions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Registered Players</h3>
                  <div className="flex flex-wrap gap-2">
                    {session.players?.map((playerId) => {
                      const player = players.find(p => p.id === playerId);
                      if (!player) return null;

                      return (
                        <div
                          key={player.id}
                          className="flex items-center gap-1 bg-gray-100 rounded-full pl-1 pr-2 py-1"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {player.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{player.name}</span>
                          {session.status === "registration" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1"
                              onClick={() => removePlayerFromSession(session.id, player.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {session.status === "registration" && (
                  <div className="mb-4">
                    <Label htmlFor={`register-player-${session.id}`} className="mb-2 block text-sm">
                      Register Player {session.players?.length || 0}/{settings.max_players}
                    </Label>
                    <Select
                      value={playerToRegister}
                      onValueChange={(value) => {
                        registerForSession(session.id, value);
                      }}
                      disabled={(session.players?.length || 0) >= 2 * settings.max_players}
                    >
                      <SelectTrigger id={`register-player-${session.id}`}>
                        <SelectValue placeholder={
                          (session.players?.length || 0) >= 2 * settings.max_players 
                            ? "Maximum players reached" 
                            : "Select player to register"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {players
                          .filter(p => !session.players?.includes(p.id))
                          .map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {(session.status === "registration" || session.status === "active") && (
                    <Button
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                      onClick={() => handleOpenTransaction(session)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Transaction
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleOpenSummary(session)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    All Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              {sessionToDelete?.status === "completed" ? (
                "Warning: Deleting a completed session will remove all transaction data and adjust player statistics. This action cannot be undone."
              ) : (
                "Are you sure you want to delete this session? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => sessionToDelete && deleteSession(sessionToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedSessionForTransaction} onOpenChange={(open) => {
          if (!open) {
            setSelectedSessionForTransaction(null);
            setDisplayedTransactions([]);
            setTransactionAmount("");
            setTransactionPlayer("");
            setTransactionType("buy_in");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
            <DialogTitle>
              New Transaction
            </DialogTitle>
            <DialogDescription>
              Add a new buy-in or cash-out transaction for this session
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <form onSubmit={handleTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Player</Label>
                  <Select
                    value={transactionPlayer || ""}
                    onValueChange={(value) => {
                      console.log('Selected player ID:', value);
                      setTransactionPlayer(String(value));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {players.find(p => String(p.id) === transactionPlayer)?.name || "Select player"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSessionForTransaction?.players?.map((playerId) => {
                        const player = players.find(p => String(p.id) === String(playerId));
                        return player ? (
                          <SelectItem key={player.id} value={String(player.id)}>
                            {player.name}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={transactionType}
                    onValueChange={setTransactionType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy_in">Buy-in</SelectItem>
                      <SelectItem value="cash_out">Cash-out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount (₪)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!transactionPlayer || !transactionAmount}
              >
                Add Transaction
              </Button>
            </form>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Session Transactions</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedTransactions.map((transaction) => {
                      const player = players.find(p => p.id === transaction.player_id);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{player?.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={transaction.is_buy_in
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"}
                            >
                              {transaction.is_buy_in ? "Buy-in" : "Cash-out"}
                            </Badge>
                          </TableCell>
                          <TableCell>₪{transaction.amount}</TableCell>
                          <TableCell>
                            {transaction.created_at ? format(new Date(transaction.created_at.replace('+00:00', '')), "HH:mm:ss") : "No time"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {displayedTransactions.length === 0 && (
                      <TableRow>
                        <TableCell 
                          colSpan={5} 
                          className="text-center text-gray-500 py-4"
                        >
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!sessionForSummary} 
        onOpenChange={(open) => {
          if (!open) {
            setSessionForSummary(null);
            setDisplayedTransactions([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Session Summary</DialogTitle>
            <DialogDescription>
              View all transactions and player results for this session
              {sessionForSummary && sessionForSummary.date && (
                <p className="mt-1 font-medium">
                  {format(new Date(sessionForSummary.date), "MMMM d, yyyy")}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6 overflow-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Player</TableHead>
                    <TableHead>Total Buy-in</TableHead>
                    <TableHead>Total Cash-out</TableHead>
                    <TableHead>Net Profit/Loss</TableHead>
                    <TableHead>Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionForSummary?.players?.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    if (!player) return null;

                    const playerTransactions = displayedTransactions.filter(t => t.player_id === playerId);
                    const totalBuyIn = playerTransactions
                      .filter(t => t.is_buy_in)
                      .reduce((sum, t) => sum + t.amount, 0);
                    const totalCashOut = playerTransactions
                      .filter(t => !t.is_buy_in)
                      .reduce((sum, t) => sum + t.amount, 0);
                    const totalProfit = totalCashOut - totalBuyIn;

                    return (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {player.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            {player.name}
                          </div>
                        </TableCell>
                        <TableCell>₪{totalBuyIn}</TableCell>
                        <TableCell>₪{totalCashOut}</TableCell>
                        <TableCell>
                          <Badge variant={totalProfit >= 0 ? "success" : "destructive"}>
                            ₪{totalProfit}
                          </Badge>
                        </TableCell>
                        <TableCell>{playerTransactions.length}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell>
                      ₪{displayedTransactions
                        .filter(t => t.is_buy_in)
                        .reduce((sum, t) => sum + t.amount, 0)}
                    </TableCell>
                    <TableCell>
                      ₪{displayedTransactions
                        .filter(t => !t.is_buy_in)
                        .reduce((sum, t) => sum + t.amount, 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        ₪{displayedTransactions
                          .reduce((sum, t) => sum + (t.is_buy_in ? -t.amount : t.amount), 0)}
                      </Badge>
                    </TableCell>
                    <TableCell>{displayedTransactions.length}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <h3 className="font-medium">Transaction History</h3>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Running Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTransactions
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map((transaction) => {
                      const player = players.find(p => p.id === transaction.player_id);
                      if (!player) return null;

                      const playerTransactions = displayedTransactions.filter(t => 
                        t.player_id === transaction.player_id && 
                        new Date(t.created_at) <= new Date(transaction.created_at)
                      );
                      const runningTotal = playerTransactions.reduce((sum, t) => 
                        sum + (t.is_buy_in ? -t.amount : t.amount), 0
                      );

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.created_at ? format(new Date(transaction.created_at.replace('+00:00', '')), "HH:mm") : "No time"}</TableCell>
                          <TableCell>{player.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={transaction.is_buy_in
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"}
                            >
                              {transaction.is_buy_in ? "Buy-in" : "Cash-out"}
                            </Badge>
                          </TableCell>
                          <TableCell>₪{transaction.amount}</TableCell>
                          <TableCell>
                            <Badge variant={runningTotal >= 0 ? "success" : "destructive"}>
                              ₪{runningTotal}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSessionForSummary(null);
                setDisplayedTransactions([]);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!editingSession} 
        onOpenChange={(open) => !open && setEditingSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session Date</DialogTitle>
            <DialogDescription>
              Change the date for this poker session
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSession} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-date">Session Date</Label>
              <Input
                id="session-date"
                type="date"
                value={editingSession?.date || ''}
                onChange={(e) => setEditingSession({
                  ...editingSession,
                  date: e.target.value
                })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSession(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
