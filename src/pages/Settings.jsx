import React, { useState, useEffect } from "react";
import { Settings } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Save, Check, Share2 } from "lucide-react";
import { 
  Alert,
  AlertDescription
} from "@/components/ui/alert";
import {
  useToast
} from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch"; 
import { SendEmail, SendSMS } from "@/api/integrations"; 
import { Session } from "@/api/entities"; 
import { Player } from "@/api/entities"; 
import { format } from "date-fns"; 

export default function SettingsPage() {
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
    contact_email: "yovava22@gmail.com",
    email_notification_enabled: true,
    whatsapp_notification_enabled: false,
    sms_notification_enabled: false,
    notification_hours_before: 24
  });
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      const settingsList = await Settings.list();
      if (settingsList.length > 0) {
        setSettings(settingsList[0]);
      }
    } catch (err) {
      setError("Failed to load settings");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaved(false);
    
    try {
      if (settings.id) {
        await Settings.update(settings.id, settings);
      } else {
        await Settings.create(settings);
      }
      setIsSaved(true);
      toast({
        title: "Settings saved",
        description: "Your game settings have been saved successfully",
        variant: "success"
      });
    } catch (err) {
      setError("Failed to save settings");
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  };

  const shareSettings = () => {
    const shareData = {
      title: 'Settings',
      text: `Check out our game settings: ${JSON.stringify(settings)}`,
      url: window.location.href
    };
    navigator.share(shareData).catch((err) => {
      console.error("Error sharing:", err);
      toast({
        title: "Share failed",
        description: "Unable to share the settings.",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Game Settings</h1>
        <p className="text-gray-500 mt-1">Configure game rules and contact information</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSaved && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>Settings saved successfully</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="big_blind">Big Blind (₪)</Label>
                  <Input
                    id="big_blind"
                    type="number"
                    step="0.5"
                    value={settings.big_blind}
                    onChange={(e) => setSettings({
                      ...settings,
                      big_blind: parseFloat(e.target.value)
                    })}
                  />
                  <p className="text-sm text-gray-500">Small blind will be ₪{(settings.big_blind / 2).toFixed(1)}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_buyin">Minimum Buy-in (₪)</Label>
                  <Input
                    id="minimum_buyin"
                    type="number"
                    value={settings.minimum_buyin}
                    onChange={(e) => setSettings({
                      ...settings,
                      minimum_buyin: parseInt(e.target.value)
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chip_conversion_rate">Chips per ₪1</Label>
                  <Input
                    id="chip_conversion_rate"
                    type="number"
                    value={settings.chip_conversion_rate}
                    onChange={(e) => setSettings({
                      ...settings,
                      chip_conversion_rate: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maximum_buyin">Maximum Buy-in (₪)</Label>
                  <Input
                    id="maximum_buyin"
                    type="number"
                    value={settings.maximum_buyin}
                    onChange={(e) => setSettings({
                      ...settings,
                      maximum_buyin: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_players">Maximum Players</Label>
                  <Input
                    id="max_players"
                    type="number"
                    value={settings.max_players}
                    onChange={(e) => setSettings({
                      ...settings,
                      max_players: parseInt(e.target.value)
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session_buyin_limit">Session Buy-in Limit (₪)</Label>
                  <Input
                    id="session_buyin_limit"
                    type="number"
                    value={settings.session_buyin_limit}
                    onChange={(e) => setSettings({
                      ...settings,
                      session_buyin_limit: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game_schedule">Regular Game Schedule</Label>
                  <Input
                    id="game_schedule"
                    value={settings.game_schedule}
                    onChange={(e) => setSettings({
                      ...settings,
                      game_schedule: e.target.value
                    })}
                    placeholder="e.g. Monday 20:30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send email reminders before games</p>
                </div>
                <Switch
                  checked={settings.email_notification_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      email_notification_enabled: checked,
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp Notifications</Label>
                  <p className="text-sm text-gray-500">WhatsApp reminders before games (coming soon)</p>
                </div>
                <Switch
                  checked={false}
                  disabled={true}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      whatsapp_notification_enabled: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-500">SMS text reminders before games (coming soon)</p>
                </div>
                <Switch
                  checked={settings.sms_notification_enabled}
                  disabled={true}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      sms_notification_enabled: checked,
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notification_hours">Hours Before Game</Label>
                <div className="flex gap-2">
                  <Input
                    id="notification_hours"
                    type="number"
                    value={settings.notification_hours_before}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notification_hours_before: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="72"
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const sessions = await Session.list();
                        const nextSession = sessions.find(s => s.status === "registration");
                        if (!nextSession) {
                          toast({
                            title: "No upcoming session",
                            description: "Create a session first to test notifications",
                            variant: "destructive"
                          });
                          return;
                        }

                        const players = await Player.list({
                          id: { $in: nextSession.players }
                        });

                        const emailsSent = [];
                        
                        const gameTime = settings.game_schedule.split(" ")[1];
                        const [hours, minutes] = gameTime.split(":");
                        const gameDateTime = new Date(nextSession.date);
                        gameDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

                        // First check if we have any players with emails
                        const playersWithEmail = players.filter(player => player.email);
                        if (playersWithEmail.length === 0) {
                          toast({
                            title: "No players with email",
                            description: "None of the registered players have an email address set.",
                            variant: "destructive"
                          });
                          return;
                        }

                        for (const player of players) {
                          if (settings.email_notification_enabled && player.email) {
                            try {
                              await SendEmail({
                                to: player.email,
                                subject: "♠️ Upcoming Poker Game Notification ♥️",
                                body: `Hi ${player.name} 👋,

This is a quick reminder about our upcoming poker game night! 🎉🃏
Here are the details:

📅 Date: ${gameDateTime ? format(gameDateTime, 'MMMM d, yyyy') : 'No date'}
⏰ Time: ${gameTime}
💸 Buy-in Range: ₪${settings.minimum_buyin} - ₪${settings.maximum_buyin}

Please make sure to arrive on time ⏱️ — the stakes are high and the fun is guaranteed! 😄

See you at the table!

Best regards,
${settings.contact_name} 🧑‍💼
https://app--poker-cash-flow-ccf0fb63.base44.app/`
                              });
                              emailsSent.push(player.name);
                              console.log(`Demo Mode: Email sent to ${player.name} at ${player.email}`);
                            } catch (error) {
                              console.error(`Failed to send email to ${player.name}:`, error);
                            }
                          }
                        }

                        if (emailsSent.length > 0) {
                          toast({
                            title: "Test notifications sent",
                            description: `Email notifications sent to: ${emailsSent.join(", ")}.\nWhatsApp and SMS notifications are not available in demo mode.`,
                            variant: "success"
                          });
                        } else {
                          toast({
                            title: "No notifications sent",
                            description: "No emails were sent. Make sure players have email addresses and notifications are enabled.",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        console.error("Error sending test notifications:", error);
                        toast({
                          title: "Error",
                          description: "Failed to send notifications. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Test Notifications
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Notifications will be sent {settings.notification_hours_before} hours before each game
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Note: WhatsApp and SMS notifications are currently not available in demo mode. Only email notifications will be sent.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment & Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paybox_link">PayBox Payment Link</Label>
                  <Input
                    id="paybox_link"
                    value={settings.paybox_link}
                    onChange={(e) => setSettings({
                      ...settings,
                      paybox_link: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={settings.contact_name}
                    onChange={(e) => setSettings({
                      ...settings,
                      contact_name: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      contact_phone: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({
                      ...settings,
                      contact_email: e.target.value
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
