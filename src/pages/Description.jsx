
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "@/api/entities";
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  AlertCircle, 
  Award, 
  Mail, 
  Users, 
  Calendar, 
  Clock, 
  Link as LinkIcon,
  ExternalLink,
  Smartphone,
  Pencil,
  Phone
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function Description() {
  const [settings, setSettings] = useState({
    big_blind: 1.0,
    minimum_buyin: 50,
    maximum_buyin: 100,
    session_buyin_limit: 300,
    chip_conversion_rate: 2,
    max_players: 7,
    game_schedule: "Monday 20:30",
    paybox_link: "https://link.payboxapp.com/gDnmkY99BAyNg3v49",
    contact_name: "Yovav Antebi",
    contact_phone: "058-669-8200",
    contact_email: "yovava22@gmail.com"
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settingsList = await Settings.list();
    if (settingsList.length > 0) {
      setSettings(settingsList[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Game Description</h1>
          <p className="text-gray-500 mt-1">Rules, guidelines, and payment information</p>
        </div>
        <Link to={createPageUrl("Settings")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Edit Settings <Pencil className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Poker Game Rules
            </CardTitle>
            <CardDescription>
              Texas Hold'em with betting limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Game Format</h3>
              <p>We play Texas Hold'em with the following structure:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Small Blind: <strong>₪{(settings.big_blind / 2).toFixed(1)}</strong></li>
                <li>Big Blind: <strong>₪{settings.big_blind.toFixed(1)}</strong></li>
                <li>Minimum Buy-in: <strong>₪{settings.minimum_buyin}</strong></li>
                <li>Maximum Buy-in: <strong>₪{settings.maximum_buyin}</strong></li>
                <li>Maximum Loss Limit: <strong>₪{settings.session_buyin_limit}</strong></li>
                <li>Maximum Stuck Limit: <strong>₪{2*settings.session_buyin_limit} (Cash out anything above)</strong></li>
                <li>Maximum players per table: <strong>{settings.max_players}</strong></li>
                <li>Chip conversion: <strong>1 NIS = {settings.chip_conversion_rate} chips</strong></li>
                <li>Re-buys allowed when stack is below <strong>₪{Math.floor(settings.minimum_buyin / 2)}</strong> (half minimum buy-in)</li>

              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              House Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Sessions typically last 2.5-3.5 hours</li>
                <li>Maximum of {settings.max_players} players per table</li>
                <li>Players can request a chip count at any time</li>
                <li>Any player adds ₪15 to your first buy-in to cover food and drinks</li>
                <li>Try to arrive about 10 minutes early</li>
                <li>At the start of the session, we use blinds as if there are {settings.max_players} players, even if some seats are empty</li>
                <li>If you arrive late, you must buy the remaining stack at your seat, which counts as a minimum buy-in of ₪{settings.minimum_buyin}, even if the stack is smaller</li>
                <li>A player can only rebuy if their stack is below half of the minimum buy-in</li>
                <li>A player cannot buy more than the maximum buy-in limit for the session (₪{settings.session_buyin_limit})</li>
                <li>Straddles are allowed (2x big blind)</li>
                <li>Running it twice is allowed if all players agree</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Session Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p>Regular sessions are held:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>{settings.game_schedule}</strong></li>
              </ul>
              <p className="mt-4">Notification for upcoming games will be sent 3-2 days in advance.</p>
              <p>Please RSVP for games by registering in the app at least 24 hours before the session.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Methods for buy-ins and cash-outs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Payment Apps</h3>
              <p>We accept payments through the following apps:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold">PayBox</h4>
                    <div className="flex mt-1">
                      <a href={settings.paybox_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                        Open payment link <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold">Cash</h4>
                    <p className="text-sm text-gray-500">Physical cash is also accepted</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-red-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{settings.contact_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-500" />
                <a href={`tel:${settings.contact_phone}`} className="text-blue-600 hover:underline">
                  {settings.contact_phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-500" />
                <a href={`mailto:${settings.contact_email}`} className="text-blue-600 hover:underline">
                  {settings.contact_email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
