import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Calendar,
  Trophy,
  Users,
  Share,
  Wallet,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function LastSessionStats({ session, transactions, onShare }) {
  if (!session || !transactions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Completed Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            No completed sessions available yet. Complete a poker session to see results.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate session statistics
  const totalBuyIn = transactions.reduce((sum, t) => sum + t.buyIn, 0);
  const totalCashOut = transactions.reduce((sum, t) => sum + t.cashOut, 0);
  const totalProfit = totalCashOut - totalBuyIn;
  const profitablePlayers = transactions.filter(t => t.profit > 0).length;

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Last Completed Session
            </CardTitle>
            <p className="text-sm text-gray-500">
              Final results from {format(new Date(session.date), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
              <Users className="w-4 h-4" />
              {transactions.length} Players
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-black">
              <Wallet className="w-4 h-4" />
              ₪{totalBuyIn} Played
            </Badge>
            <Button
              variant="outline"
              size="icon"
              className="bg-gradient-to-r from-blue-400 to-blue-500 text-white border-none hover:from-blue-500 hover:to-blue-600"
              onClick={onShare}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Session Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Top Player
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              {transactions.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-800">
                        {transactions[0].player.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{transactions[0].player.name}</span>
                  </div>
                  <Badge variant="success">₪{transactions[0].profit}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Player Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Winners</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {profitablePlayers}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Losers</span>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {transactions.length - profitablePlayers}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              {transactions.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-800">
                        {transactions[0].player.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{transactions[0].player.name}</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {((transactions[0].profit / transactions[0].buyIn) * 100).toFixed(1)}%
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Buy-in</TableHead>
                <TableHead>Cash-out</TableHead>
                <TableHead>Profit/Loss</TableHead>
                <TableHead>Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.player.id}
                  className={
                    transaction.profit > 0
                      ? "bg-green-50"
                      : transaction.profit < 0
                      ? "bg-red-50"
                      : ""
                  }
                >
                  <TableCell>{transaction.player.name}</TableCell>
                  <TableCell>₪{transaction.buyIn}</TableCell>
                  <TableCell>₪{transaction.cashOut}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {transaction.profit > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <Badge
                        variant={transaction.profit >= 0 ? "success" : "destructive"}
                      >
                        ₪{transaction.profit}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={transaction.profit >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {((transaction.profit / transaction.buyIn) * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell>Total</TableCell>
                <TableCell>₪{totalBuyIn}</TableCell>
                <TableCell>₪{totalCashOut}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {totalProfit > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <Badge variant={totalProfit >= 0 ? "success" : "destructive"}>
                      ₪{totalProfit}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={totalProfit >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {((totalProfit / totalBuyIn) * 100).toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
