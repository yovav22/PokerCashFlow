import React, { useState, useEffect } from "react";
import { Group } from "@/api/entities";
import { Session } from "@/api/entities";
import { Player } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell
} from "recharts";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  Calendar,
  Award,
  Trash2,
  Edit,
  List,
  Users,
  FileText,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  UserIcon,
  Gamepad2,
  AlertCircle,
  Trophy,
  Target,
  Star,
  Heart,
  Gamepad,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { BellRing, BellOff } from "lucide-react";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAccountDialog, setNewAccountDialog] = useState(false);
  const [newTransactionDialog, setNewTransactionDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [editAccountDialog, setEditAccountDialog] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [activeTab, setActiveTab] = useState("groups"); // Define activeTab state
  const [contactDialogOpen, setContactDialogOpen] = useState(false); // Define contactDialogOpen state

  // Form states
  const [newAccount, setNewAccount] = useState({
    name: "",
    description: "",
    icon: "piggyBank",
    owner: "",
    players: [],
    games: [],
    notifications_enabled: true,
    total_balance: 0,
    total_deposits: 0,
    total_withdrawals: 0
  });

  const groupIcons = {
    piggyBank: { icon: PiggyBank, color: "bg-pink-100 text-pink-600" },
    wallet: { icon: Wallet, color: "bg-purple-100 text-purple-600" },
    users: { icon: Users, color: "bg-blue-100 text-blue-600" },
    trophy: { icon: Trophy, color: "bg-yellow-100 text-yellow-600" },
    target: { icon: Target, color: "bg-red-100 text-red-600" },
    star: { icon: Star, color: "bg-indigo-100 text-indigo-600" },
    heart: { icon: Heart, color: "bg-rose-100 text-rose-600" },
    gamepad: { icon: Gamepad, color: "bg-green-100 text-green-600" }
  };

  const [editAccount, setEditAccount] = useState(null);

  useEffect(() => {
    loadData();
  }, [retryCount]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groups, players, sessions, transactions] = await Promise.all([
        Group.list(),
        Player.list(),
        Session.list(),
        Transaction.list()
      ]);

      setGroups(groups);
      setPlayers(players);
      setSessions(sessions);
      setTransactions(transactions);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {

      const createdGroup = await Group.create(newAccount);
      setGroups([...groups, createdGroup]);
      setNewAccount({
        name: "",
        description: "",
        icon: "piggyBank",
        owner: "",
        players: [],
        games: [],
        notifications_enabled: true,
        total_balance: 0,
        total_deposits: 0,
        total_withdrawals: 0
      });
      setNewAccountDialog(false);
    } catch (error) {
      console.error("Error creating account:", error);
      setError("Failed to create account. Please try again.");
    }
  };

  const handleUpdateAccount = async () => {
    try {
      await Group.update(editAccount.id, editAccount);
      const updatedGroups = groups.map(group => 
        group.id === editAccount.id ? editAccount : group
      );
      setGroups(updatedGroups);
      setEditAccountDialog(false);
    } catch (error) {
      console.error("Error updating account:", error);
      setError("Failed to update account. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!selectedAccountId) return;
      
      // First, delete all transactions for this account
      const accountTransactions = await Transaction.filter({
        group_id: selectedAccountId
      });
      
      for (const transaction of accountTransactions) {
        await Transaction.delete(transaction.id);
      }
      
      // Then delete the account
      await Group.delete(selectedAccountId);
      
      const updatedGroups = groups.filter(group => group.id !== selectedAccountId);
      setGroups(updatedGroups);
      setSelectedAccountId(null);
      setDeleteConfirmDialog(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account. Please try again.");
    }
  };

  const getOwnerName = (owner) => {
    if (!owner) return "No owner";
    const player = players.find(p => p.id === owner);
    return player ? player.name : "Unknown";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
          <p className="text-xl">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-gray-500 mt-1">Track players and contacts</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700"
          onClick={() => setNewAccountDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Group
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRetryCount(prev => prev + 1)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Groups table */}
      {groups.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <PiggyBank className="h-16 w-16 text-gray-400" />
              <div>
                <h3 className="text-xl font-semibold">No groups yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mt-1">
                  Create a group to track poker group funds, tournament payouts, and other expenses.
                </p>
              </div>
              <Button
                className="mt-4 bg-red-600 hover:bg-red-700"
                onClick={() => setNewAccountDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-red-500" />
              Groups
            </CardTitle>
            <CardDescription>
              Manage all your poker groups and their finances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Owner</TableHead>
                    <TableHead className="text-center">Players</TableHead>
                    <TableHead className="text-center">Games</TableHead>
                    <TableHead className="text-center">Notifications</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(group => (
                    <TableRow 
                      key={group.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${groupIcons[group.icon || 'piggyBank'].color}`}>
                            {React.createElement(
                              groupIcons[group.icon || 'piggyBank'].icon,
                              { className: `w-4 h-4` }
                            )}
                          </div>
                          <div>
                            <div>{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-gray-500">{group.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getOwnerName(group.owner).split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{getOwnerName(group.owner)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group.players?.length || 0}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Gamepad2 className="w-3 h-3" />
                            {group.games?.length || 0}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={group.notifications_enabled !== false}
                            onCheckedChange={async (checked) => {
                              try {
                                await Group.update(group.id, {
                                  ...group,
                                  notifications_enabled: checked
                                });
                                
                                const updatedGroups = groups.map(g => 
                                  g.id === group.id 
                                    ? {...g, notifications_enabled: checked} 
                                    : g
                                );
                                setGroups(updatedGroups);
                              } catch (error) {
                                console.error("Error updating notifications setting:", error);
                                setError("Failed to update notifications setting.");
                              }
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditAccount(group);
                              setEditAccountDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedAccountId(group.id);
                              setDeleteConfirmDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Group Dialog */}
      <Dialog open={newAccountDialog} onOpenChange={setNewAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group to track poker group funds and expenses.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="account-name">Group Name</Label>
              <Input
                id="account-name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                placeholder="e.g. Poker League Fund"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-description">Description (Optional)</Label>
              <Textarea
                id="account-description"
                value={newAccount.description}
                onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                placeholder="Add a description for this group..."
              />
            </div>

            <div className="space-y-2">
              <Label>Group Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(groupIcons).map(([key, { icon: Icon, color }]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    className={`h-12 ${newAccount.icon === key ? 'border-2 border-red-500' : ''}`}
                    onClick={() => setNewAccount({...newAccount, icon: key})}
                  >
                    <div className={`p-2 rounded-full ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-owner">Owner</Label>
              <Select
                value={newAccount.owner}
                onValueChange={(value) => 
                  setNewAccount({...newAccount, owner: value})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group owner" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={newAccount.notifications_enabled}
                onCheckedChange={(checked) => 
                  setNewAccount({...newAccount, notifications_enabled: checked})
                }
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="notifications" className="flex items-center cursor-pointer">
                {newAccount.notifications_enabled ? (
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAccountDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCreateAccount}
              disabled={!newAccount.name.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editAccountDialog} onOpenChange={setEditAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group details.
            </DialogDescription>
          </DialogHeader>
          
          {editAccount && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-account-name">Group Name</Label>
                <Input
                  id="edit-account-name"
                  value={editAccount.name}
                  onChange={(e) => setEditAccount({...editAccount, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-account-description">Description (Optional)</Label>
                <Textarea
                  id="edit-account-description"
                  value={editAccount.description || ""}
                  onChange={(e) => setEditAccount({...editAccount, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Group Icon</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(groupIcons).map(([key, { icon: Icon, color }]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      className={`h-12 ${editAccount.icon === key ? 'border-2 border-red-500' : ''}`}
                      onClick={() => setEditAccount({...editAccount, icon: key})}
                    >
                      <div className={`p-2 rounded-full ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-account-owner">Owner</Label>
                <Select
                  value={editAccount.owner || ""}
                  onValueChange={(value) => 
                    setEditAccount({...editAccount, owner: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-notifications"
                  checked={editAccount.notifications_enabled !== false}
                  onCheckedChange={(checked) => 
                    setEditAccount({...editAccount, notifications_enabled: checked})
                  }
                  className="data-[state=checked]:bg-green-600"
                />
                <Label htmlFor="edit-notifications" className="flex items-center cursor-pointer">
                  {editAccount.notifications_enabled !== false ? (
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
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccountDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleUpdateAccount}
              disabled={!editAccount?.name?.trim()}
            >
              Update Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This will permanently remove the group and all its transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAccount}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
