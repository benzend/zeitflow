import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Plus, Trash2, TestTube } from 'lucide-react';

interface SlackBot {
  id: number;
  name: string;
  teamName: string;
  teamId: string;
  isActive: boolean;
  createdAt: string;
}

export default function SlackBotManager() {
  const [bots, setBots] = useState<SlackBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/slack/bots');
      const data = await response.json();
      if (data.success) {
        setBots(data.bots);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to fetch Slack bots');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    try {
      const response = await fetch('/api/slack/install');
      const data = await response.json();
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
    } catch {
      setError('Failed to start Slack installation');
    }
  };

  const handleDelete = async (botId: number) => {
    if (!confirm('Are you sure you want to deactivate this Slack bot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/slack/bots?id=${botId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchBots();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to delete Slack bot');
    }
  };

  const handleTest = async (bot: SlackBot) => {
    try {
      const response = await fetch('/api/slack/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: bot.teamId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Test message sent successfully!');
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to test Slack connection');
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Your Slack Bots</h3>
        <Button onClick={handleInstall} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Slack Bot
        </Button>
      </div>

      {bots.length === 0 ? (
        <p className="text-gray-400">No Slack bots configured yet.</p>
      ) : (
        <div className="space-y-2">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-background p-3 rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-medium text-foreground">{bot.name}</h4>
                <p className="text-sm text-gray-400">
                  {bot.teamName} ({bot.teamId})
                </p>
                <p className="text-xs text-gray-500">
                  Added {new Date(bot.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="tertiary"
                  onClick={() => handleTest(bot)}
                  className="!p-2"
                  title="Test connection"
                >
                  <TestTube className="w-4 h-4" />
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => handleDelete(bot.id)}
                  className="!p-2 text-red-400 hover:text-red-300"
                  title="Deactivate bot"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> When you add a Slack bot, you&apos;ll be redirected to Slack to authorize the app.
          The bot will request permission to send messages and read channel information.
        </p>
      </div>
    </div>
  );
}