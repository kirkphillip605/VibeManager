import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useState, useCallback } from "react";
import { Gig, Venue, Customer } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GigFormDialog } from "@/components/gig-form-dialog";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// Set up date-fns localizer for react-big-calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Define the event type for the calendar
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  gigType?: string;
  customer?: string;
  venue?: string;
  status?: string;
  resource?: Gig;
}

// Extend react-big-calendar with drag and drop
const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

export default function CalendarPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showGigForm, setShowGigForm] = useState(false);
  const [selectedGig, setSelectedGig] = useState<Gig | undefined>();

  // Fetch gigs
  const { data: gigs = [], isLoading: gigsLoading } = useQuery<Gig[]>({
    queryKey: ["/api/gigs"],
  });

  // Fetch venues
  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Update gig mutation
  const updateGigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Gig> }) => {
      const res = await apiRequest("PUT", `/api/gigs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({
        title: "Gig updated",
        description: "The gig has been rescheduled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Transform gigs to calendar events
  const events: CalendarEvent[] = gigs.map((gig) => {
    const venue = venues.find(v => v.id === gig.venueId);
    const customer = customers.find(c => c.id === gig.customerId);
    
    return {
      id: gig.id,
      title: gig.name || 'Unnamed Gig',
      start: new Date(gig.startTime),
      end: new Date(gig.endTime),
      gigType: gig.gigTypeId || undefined,
      customer: customer?.businessName || `${customer?.firstName} ${customer?.lastName}`,
      venue: venue?.name,
      status: gig.status || 'pending',
      resource: gig, // Store the full gig object for reference
    };
  });

  // Handle event drop (drag and drop)
  const handleEventDrop = useCallback(
    ({ event, start, end }: any) => {
      const gig = event.resource as Gig;
      
      updateGigMutation.mutate({
        id: gig.id,
        data: {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
    },
    [updateGigMutation]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    ({ event, start, end }: any) => {
      const gig = event.resource as Gig;
      
      updateGigMutation.mutate({
        id: gig.id,
        data: {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
    },
    [updateGigMutation]
  );

  // Handle event click
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const gig = event.resource as Gig;
    setSelectedGig(gig);
    setShowGigForm(true);
  }, []);

  // Handle slot selection (for creating new events)
  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedGig(undefined);
    setShowGigForm(true);
  }, []);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="p-1 h-full" data-testid={`event-${event.id}`}>
      <div className="font-medium text-xs truncate">{event.title}</div>
      {event.venue && (
        <div className="text-xs text-muted-foreground truncate">{event.venue}</div>
      )}
      {event.customer && (
        <div className="text-xs text-muted-foreground truncate">{event.customer}</div>
      )}
      <Badge 
        variant={event.status === 'Completed' ? 'secondary' : 'default'} 
        className="text-xs px-1 py-0 mt-1"
      >
        {event.status}
      </Badge>
    </div>
  );

  // Custom toolbar component
  const CustomToolbar = ({ date, onNavigate, view, onView }: any) => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('PREV')}
          data-testid="button-calendar-prev"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('TODAY')}
          data-testid="button-calendar-today"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('NEXT')}
          data-testid="button-calendar-next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-4">
          {format(date, 'MMMM yyyy')}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-md">
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onView('month')}
            data-testid="button-view-month"
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onView('week')}
            data-testid="button-view-week"
          >
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onView('day')}
            data-testid="button-view-day"
          >
            Day
          </Button>
        </div>
        <Button
          onClick={() => {
            setSelectedGig(undefined);
            setShowGigForm(true);
          }}
          data-testid="button-add-gig"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Gig
        </Button>
      </div>
    </div>
  );

  if (gigsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 overflow-hidden">
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: CalendarEvent) => event.start}
          endAccessor={(event: CalendarEvent) => event.end}
          style={{ height: 'calc(100vh - 120px)' }}
          date={currentDate}
          onNavigate={setCurrentDate}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelectEvent={(event: any) => handleSelectEvent(event)}
          onSelectSlot={handleSelectSlot}
          selectable
          resizable
          components={{
            toolbar: CustomToolbar,
            event: EventComponent as any,
          }}
          defaultView="month"
          views={['month', 'week', 'day']}
          step={30}
          showMultiDayTimes
          eventPropGetter={(event: any) => ({
            className: `calendar-event ${event.status?.toLowerCase()}`,
            style: {
              backgroundColor: event.status === 'completed' ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
              color: event.status === 'completed' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
              border: 'none',
              borderRadius: '4px',
            },
          })}
        />
      </Card>

      <GigFormDialog
        open={showGigForm}
        onOpenChange={setShowGigForm}
        gig={selectedGig}
      />
    </div>
  );
}