import React, { useState } from "react";
import { Player } from "@/api/entities";
import { Session } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Group } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Trash2, Loader2, RefreshCw } from "lucide-react";

export default function DataCleanup() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [error, setError] = useState(null);

  const deleteAllData = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    
    const results = {
      players: { total: 0, deleted: 0 },
      sessions: { total: 0, deleted: 0 },
      transactions: { total: 0, deleted: 0 },
      groups: { total: 0, deleted: 0 }
    };

    try {
      // Delete all transactions first since they reference other entities
      const transactions = await Transaction.list();
      results.transactions.total = transactions.length;
      for (const transaction of transactions) {
        await Transaction.delete(transaction.id);
        results.transactions.deleted++;
      }

      // Delete all game sessions
      const sessions = await Session.list();
      results.sessions.total = sessions.length;
      for (const session of sessions) {
        await Session.delete(session.id);
        results.sessions.deleted++;
      }

      // Delete all groups
      const groups = await Group.list();
      results.groups.total = groups.length;
      for (const group of groups) {
        await Group.delete(group.id);
        results.groups.deleted++;
      }

      // Delete all players
      const players = await Player.list();
      results.players.total = players.length;
      for (const player of players) {
        await Player.delete(player.id);
        results.players.deleted++;
      }

      setResults(results);
    } catch (err) {
      console.error("Error deleting data:", err);
      setError("An error occurred while deleting data. Some records may not have been deleted.");
    } finally {
      setLoading(false);
      setConfirmDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Cleanup</h1>
          <p className="text-gray-500 mt-1">Delete application data</p>
        </div>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">⚠️ Warning: Destructive Action</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This page allows you to delete all data from the application. This action cannot be undone.</p>
          
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => setConfirmDialog(true)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Data...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Deletion Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Players</h3>
                <p>Deleted {results.players.deleted} of {results.players.total} players</p>
              </div>
              <div>
                <h3 className="font-semibold">Sessions</h3>
                <p>Deleted {results.sessions.deleted} of {results.sessions.total} sessions</p>
              </div>
              <div>
                <h3 className="font-semibold">Transactions</h3>
                <p>Deleted {results.transactions.deleted} of {results.transactions.total} transactions</p>
              </div>
              <div>
                <h3 className="font-semibold">Groups</h3>
                <p>Deleted {results.groups.deleted} of {results.groups.total} groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all data from the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAllData} className="bg-red-600 hover:bg-red-700">
              Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}