import React, { useState, useEffect } from "react";
import { Settings } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Save, Check, Share2 } from "lucide-react";
import { getCurrentGroup } from "@/utils/groupStorage";
import { 
  Alert,
  AlertDescription
} from "@/components/ui/alert";
import {
  useToast
} from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch"; 
import { SendEmail, SendSMS, SendWhatsApp } from "@/api/integrations"; 
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
      const currentGroup = getCurrentGroup(); 
      const settingsList = await Settings.getByGroup(currentGroup.id);
      if (settingsList) {
        setSettings(settingsList);
      } else {
        await Settings.createByGroup(currentGroup.id, settings);
      }
    } catch (err) {
      console.error('Error loading settings:', err.message);
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
      const currentGroup = getCurrentGroup(); 
      await Settings.updateByGroup(currentGroup.id, settings);
      setIsSaved(true);
      // toast({
      //   title: "Settings saved",
      //   description: "Your game settings have been saved successfully",
      //   variant: "success"
      // });
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

  const generateNotificationBody = (player, sessionHost, gameDateTime, gameTime, settings, sessionPlayers) => {
    return `Hi ${player.name} 👋,

This is a quick reminder about our upcoming poker game night! 🎉🃏

🎲 Game Details:
📅 Date: ${gameDateTime ? format(gameDateTime, 'MMMM d, yyyy') : 'No date'}
⏰ Time: ${gameTime}
🏠 Host: ${sessionHost.name}
📱 Contact: ${sessionHost.phone || 'Not provided'}
📧 Email: ${sessionHost.email || 'Not provided'}

💰 Game Rules:
• Big Blind: ₪${settings.big_blind}
• Small Blind: ₪${settings.big_blind / 2}
• Buy-in Range: ₪${settings.minimum_buyin} - ₪${settings.maximum_buyin}
• Maximum Buy-in per Session: ₪${settings.session_buyin_limit}
• Chips per ₪1: ${settings.chip_conversion_rate}
• Maximum Players: ${settings.max_players}

👥 Registered Players (${sessionPlayers.length}/${settings.max_players}):
${sessionPlayers.map(p => `• ${p.name}`).join('\n')}

💳 Payment:
• PayBox Link: ${settings.paybox_link}
• Send your buy-in before the game starts

Please make sure to arrive on time ⏱️ — the stakes are high and the fun is guaranteed! 😄

See you at the table! 🎲

Best regards,
${settings.contact_name} 🧑‍💼
📱 ${settings.contact_phone}
📧 ${settings.contact_email}

🌐 Join the game:
https://app--poker-cash-flow-ccf0fb63.base44.app/`;
  };

  const generateSMSBody = (player, sessionHost, gameDateTime, gameTime) => {
    return `Poker Night Reminder!
Date: ${gameDateTime ? format(gameDateTime, 'MMM d') : 'TBD'} at ${gameTime}
Host: ${sessionHost.name} (${sessionHost.phone || 'No phone'})
Please confirm your attendance.`;
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
                  checked={settings.whatsapp_notification_enabled}
                  disabled={false}
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
                  disabled={false}
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

                        // Get only the players registered for this session
                        const registeredPlayers = await Player.list();
                        const sessionPlayers = registeredPlayers.filter(player => 
                          nextSession.players.includes(player.id)
                        );

                        // Get the host information
                        const sessionHost = registeredPlayers.find(player => player.id === nextSession.host);
                        if (!sessionHost) {
                          toast({
                            title: "No host assigned",
                            description: "Please assign a host to the session before sending notifications",
                            variant: "destructive"
                          });
                          return;
                        }

                        const notificationsSent = {
                          email: [],
                          sms: [],
                          whatsapp: []
                        };
                        
                        const gameTime = settings.game_schedule.split(" ")[1];
                        const [hours, minutes] = gameTime.split(":");
                        const gameDateTime = new Date(nextSession.date);
                        gameDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

                        // Check if we have any players with contact information
                        const playersWithContacts = sessionPlayers.filter(player => 
                          player.email || player.phone
                        );

                        if (playersWithContacts.length === 0) {
                          toast({
                            title: "No players with contact info",
                            description: "None of the registered players have contact information set.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        for (const player of sessionPlayers) {
                          const notificationBody = generateNotificationBody(
                            player,
                            sessionHost,
                            gameDateTime,
                            gameTime,
                            settings,
                            sessionPlayers
                          );

                          // Send Email Notifications
                          if (settings.email_notification_enabled && // Group level
                              player.notifications_enabled && // Player level
                              player.email) { // Channel level (has email)
                            try {
                              await SendEmail({
                                to: player.email,
                                subject: "♠️ Upcoming Poker Game Notification ♥️",
                                body: notificationBody
                              });
                              notificationsSent.email.push(player.name);
                            } catch (error) {
                              console.error(`Failed to send email to ${player.name}:`, error);
                            }
                          }
                          
                          // Send WhatsApp Notifications
                          if (settings.whatsapp_notification_enabled && // Group level
                              player.notifications_enabled && // Player level
                              player.phone) { // Channel level (has phone)
                            try {
                              await SendWhatsApp({
                                to: player.phone,
                                body: notificationBody
                              });
                              notificationsSent.whatsapp.push(player.name);
                            } catch (error) {
                              console.error(`Failed to send WhatsApp message to ${player.name}:`, error);
                            }
                          }

                          // Send SMS Notifications
                          if (settings.sms_notification_enabled && // Group level
                              player.notifications_enabled && // Player level
                              player.phone) { // Channel level (has phone)
                            try {
                              await SendSMS({
                                to: player.phone,
                                body: generateSMSBody(
                                  player,
                                  sessionHost,
                                  gameDateTime,
                                  gameTime
                                )
                              });
                              notificationsSent.sms.push(player.name);
                            } catch (error) {
                              console.error(`Failed to send SMS to ${player.name}:`, error);
                            }
                          }
                        }

                        // Update the summary message to include notification preferences info
                        const notificationSummary = [];
                        if (notificationsSent.email.length > 0) {
                          notificationSummary.push(`Email: ${notificationsSent.email.length} player(s)`);
                        }
                        if (notificationsSent.whatsapp.length > 0) {
                          notificationSummary.push(`WhatsApp: ${notificationsSent.whatsapp.length} player(s)`);
                        }
                        if (notificationsSent.sms.length > 0) {
                          notificationSummary.push(`SMS: ${notificationsSent.sms.length} player(s)`);
                        }

                        if (notificationSummary.length > 0) {
                          toast({
                            title: "Notifications Sent",
                            description: `Successfully sent notifications to:\n${notificationSummary.join('\n')}`,
                            variant: "success"
                          });
                        } else {
                          toast({
                            title: "No notifications sent",
                            description: "No notifications were sent. This could be because:\n" +
                              "• Players haven't enabled notifications\n" +
                              "• Missing contact information\n" +
                              "• Notification channels are disabled in settings",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        console.error("Error sending notifications:", error);
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
