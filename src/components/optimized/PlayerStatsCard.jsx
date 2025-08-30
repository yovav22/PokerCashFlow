import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const PlayerStatsCard = React.memo(({ 
  title, 
  player, 
  value, 
  icon: Icon, 
  colorClass = "bg-green-100 text-green-800",
  badgeVariant = "outline"
}) => {
  if (!player) return null;

  return (
    <Card className={`${colorClass.includes('bg-') ? colorClass.split(' ')[0] + '-50' : 'bg-gray-50'} border-${colorClass.includes('text-') ? colorClass.split(' ')[1].replace('text-', '') : 'gray'}-200`}>
      <CardHeader className="py-3">
        <CardTitle className={`text-sm ${colorClass.includes('text-') ? colorClass.split(' ')[1] : 'text-gray-700'} flex items-center gap-2`}>
          {Icon && <Icon className="w-4 h-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback className={colorClass}>
                {player.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {player.name}
            </span>
          </div>
          <Badge variant={badgeVariant} className={`${colorClass} text-lg`}>
            {value}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});

PlayerStatsCard.displayName = 'PlayerStatsCard';

export default PlayerStatsCard;
