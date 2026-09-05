export const dynamic = 'force-dynamic';

import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, QrCode, CheckCircle2 } from "lucide-react";

const prisma = new PrismaClient();

export default async function VolunteerDashboardPage() {
  // For demo, fetch the first volunteer user and their active tasks
  const volunteer = await prisma.user.findFirst({ where: { role: 'volunteer' } });
  
  if (!volunteer) {
    return <div className="p-8">No volunteer profiles found in DB. Run seed script.</div>;
  }

  // Get active match assigned to this volunteer
  const activeTask = await prisma.match.findFirst({
    where: { 
      assignedVolunteerId: volunteer.id, 
      status: { not: 'completed' } 
    },
    include: {
      donation: { include: { donor: true } },
      ngo: true
    }
  });

  // Get completed history
  const history = await prisma.match.findMany({
    where: { assignedVolunteerId: volunteer.id, status: 'completed' },
    include: { donation: true, ngo: true },
    orderBy: { completedAt: 'desc' },
    take: 5
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Volunteer Hub</h2>
          <p className="text-muted-foreground">Welcome back, {volunteer.name}. You have {volunteer.points} points.</p>
        </div>
        <Badge variant={volunteer.availability === 'available' ? 'default' : 'secondary'} className={volunteer.availability === 'available' ? 'bg-green-600' : ''}>
          {volunteer.availability === 'available' ? 'On Duty' : 'Off Duty'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 shadow-md">
          <CardHeader className="bg-blue-50/50">
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Current Active Task
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTask ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">{activeTask.donation.title}</div>
                    <div className="text-sm text-muted-foreground">Status: <Badge>{activeTask.status}</Badge></div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2">
                    <QrCode className="h-4 w-4" /> Scan QR
                  </Button>
                </div>
                
                <div className="relative border-l-2 border-muted-foreground/30 pl-4 ml-2 space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                    <div className="text-sm font-medium">Pickup</div>
                    <div className="text-sm text-muted-foreground">{activeTask.donation.donor.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{activeTask.donation.donor.address}</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    <div className="text-sm font-medium">Drop-off</div>
                    <div className="text-sm text-muted-foreground">{activeTask.ngo.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{activeTask.ngo.address}</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                    <MapPin className="h-4 w-4" /> Get Directions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active tasks.</p>
                <Button variant="outline" className="mt-4">Find Nearby Pickups</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery History</CardTitle>
            <CardDescription>Your recent successful deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map(task => (
                <div key={task.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">{task.donation.title}</div>
                      <div className="text-xs text-muted-foreground">To: {task.ngo.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Completed</Badge>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {task.completedAt ? task.completedAt.toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-sm text-muted-foreground">No history yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
