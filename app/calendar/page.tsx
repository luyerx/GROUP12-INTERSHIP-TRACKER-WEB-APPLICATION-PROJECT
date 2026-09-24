"use client";
import MonthGrid from "@/components/calendar/MonthGrid";

import CalendarToolbar from "@/components/calendar/CalendarToolbar";

import { CalendarEvent, eventStyles, EventType } from "@/components/calendar/calendarTypes";

import PageHeader from "@/components/ui/PageHeader";

import UpcomingEvents from "@/components/calendar/UpcomingEvents";
import ModalFrame from "@/components/ui/ModalFrame";
import { formatDateKey, isDateInputValue, toDateInputValue } from "@/lib/date";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";



type ApplicationStatus =
  | "Interested"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

type Application = {
  id: string;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: ApplicationStatus;
};

type ApplicationsApiResponse = {
  success: boolean;
  data?: Application[];
  message?: string;
};





const eventIconStyles: Record<EventType, string> = {
  deadline: "bg-rose-50 text-rose-600",

  interview: "bg-blue-50 text-blue-600",

  reminder: "bg-amber-50 text-amber-600",
};





function convertDeadlineToDateKey(deadline: string) {
  return toDateInputValue(deadline) || null;
}

function formatDisplayDate(date: string, longMonth = false) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: longMonth ? "long" : "short",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [applications, setApplications] = useState<Application[]>([]);

  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([]);

  const [isLoadingApplications, setIsLoadingApplications] = useState(true);

  const [applicationsError, setApplicationsError] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const [editingEventId, setEditingEventId] = useState<string | number | null>(
    null,
  );

  const [showEventForm, setShowEventForm] = useState(false);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [eventFormError, setEventFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const [eventType, setEventType] = useState<EventType>("interview");

  const [organisation, setOrganisation] = useState("");

  const [applicationId, setApplicationId] = useState("");

  const [eventTitle, setEventTitle] = useState("");

  const [eventDate, setEventDate] = useState("");

  const [eventTime, setEventTime] = useState("");

  const [eventLocation, setEventLocation] = useState("");

  const [eventNotes, setEventNotes] = useState("");

  const [eventsError, setEventsError] = useState("");
  const [eventsRetry, setEventsRetry] = useState(0);
  const currentYear = currentDate.getFullYear();

  const currentMonth = currentDate.getMonth();

  /*
   * Load applications from the real API.
   */
  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      try {
        const response = await fetch("/api/applications", {
          method: "GET",
          cache: "no-store",
        });

        const result: ApplicationsApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load applications.");
        }

        if (!cancelled) {
          setApplications(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error("Calendar application load error:", error);

        if (!cancelled) {
          setApplicationsError(
            error instanceof Error
              ? error.message
              : "Unable to load application deadlines.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingApplications(false);
        }
      }
    };

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadManualEvents = async () => {
      setEventsError("");
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        const result: {
          success: boolean;
          data?: CalendarEvent[];
          message?: string;
        } = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Unable to load calendar events.");
        if (!cancelled) setManualEvents(result.data || []);
      } catch (error) {
        console.error("Calendar event load error:", error);
        if (!cancelled)
          setEventsError(
            "Unable to load interviews and reminders. Your calendar may be incomplete.",
          );
      }
    };

    void loadManualEvents();

    return () => {
      cancelled = true;
    };
  }, [eventsRetry]);

  /*
   * Application deadlines become
   * automatic calendar events.
   */
  const deadlineEvents = useMemo(() => {
    return applications.flatMap((application) => {
      const date = convertDeadlineToDateKey(application.deadline);

      if (!date) {
        return [];
      }

      const event: CalendarEvent = {
        /*
         * Prefixed IDs separate
         * automatic application
         * deadlines from manual
         * events.
         */
        id: `deadline-${application.id}`,

        applicationId: application.id,

        type: "deadline",

        title: "Application deadline",

        organisation: application.organisation,

        date,

        location: application.location || undefined,
      };

      return [event];
    });
  }, [applications]);

  /*
   * Combined calendar source.
   */
  const events = useMemo(
    () => [...deadlineEvents, ...manualEvents],
    [deadlineEvents, manualEvents],
  );

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);

    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const daysInMonth = lastDay.getDate();

    const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const previousMonthLastDay = new Date(
      currentYear,
      currentMonth,
      0,
    ).getDate();

    const days: {
      date: Date;
      currentMonth: boolean;
    }[] = [];

    for (let index = firstWeekday - 1;index >= 0;index--) {
      days.push({
        date: new Date(
          currentYear,
          currentMonth - 1,
          previousMonthLastDay - index,
        ),

        currentMonth: false,
      });
    }

    for (let day = 1;day <= daysInMonth;day++) {
      days.push({
        date: new Date(currentYear, currentMonth, day),

        currentMonth: true,
      });
    }

    while (days.length < 42) {
      const day = days.length - (firstWeekday + daysInMonth) + 1;

      days.push({
        date: new Date(currentYear, currentMonth + 1, day),

        currentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const upcomingEvents = useMemo(() => {
    const todayKey = formatDateKey(new Date());

    return [...events]
      .filter((event) => event.date >= todayKey)
      .sort(
        (a, b) =>
          new Date(`${a.date}T00:00:00`).getTime() -
          new Date(`${b.date}T00:00:00`).getTime(),
      )
      .slice(0, 6);
  }, [events]);

  const resetEventForm = () => {
    setEventFormError("");
    const firstApplication = applications[0];

    setEventType("interview");

    setApplicationId(firstApplication ? String(firstApplication.id) : "");

    setOrganisation(firstApplication ? firstApplication.organisation : "");

    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setEventNotes("");
  };

  const openCreateEvent = () => {
    resetEventForm();

    setEditingEventId(null);

    setFormMode("create");

    setShowEventForm(true);
  };

  const openEditEvent = () => {
    if (!selectedEvent) {
      return;
    }

    /*
     * Automatic deadlines cannot
     * be edited directly.
     */
    if (
      selectedEvent.type === "deadline" &&
      String(selectedEvent.id).startsWith("deadline-")
    ) {
      return;
    }

    setEditingEventId(selectedEvent.id);

    setEventType(selectedEvent.type);

    setOrganisation(selectedEvent.organisation);

    setApplicationId(String(selectedEvent.applicationId));

    setEventTitle(selectedEvent.title);

    setEventFormError("");
    setEventDate(toDateInputValue(selectedEvent.date));

    setEventTime(selectedEvent.time ?? "");

    setEventLocation(selectedEvent.location ?? "");

    setEventNotes(selectedEvent.notes ?? "");

    setFormMode("edit");

    setShowEventForm(true);
  };

  const closeEventForm = () => {
    if (isSavingEvent) {
      return;
    }

    setShowEventForm(false);

    setEditingEventId(null);

    resetEventForm();
  };

  const handleSaveEvent = async () => {
    if (!applicationId || !organisation.trim() || !eventDate.trim()) {
      return;
    }

    if (isSavingEvent) return;
    setEventFormError("");
    if (!isDateInputValue(eventDate)) {
      setEventFormError("Please select a valid date.");
      return;
    }
    setIsSavingEvent(true);
    try {

      const eventData = {
        applicationId,

        type: eventType,

        title:
          eventTitle.trim() ||
          (eventType === "interview" ? "Interview" : "Reminder"),

        organisation: organisation.trim(),

        date: eventDate.trim(),

        time: eventTime.trim() || undefined,

        location: eventLocation.trim() || undefined,

        notes: eventNotes.trim() || undefined,
      };

      const response = await fetch(
        formMode === "edit" && editingEventId !== null
          ? `/api/events/${editingEventId}`
          : "/api/events",
        {
          method: formMode === "edit" && editingEventId !== null ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        },
      );
      const result: { success: boolean; data?: CalendarEvent; message?: string } =
        await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Unable to save calendar event.");
      }

      if (formMode === "edit" && editingEventId !== null) {
        setManualEvents((current) =>
          current.map((event) =>
            event.id === editingEventId ? (result.data as CalendarEvent) : event,
          ),
        );
      } else {
        setManualEvents((current) => [...current, result.data as CalendarEvent]);
      }

      const selectedDate = new Date(`${eventDate}T00:00:00`);

      setCurrentDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );

      if (formMode === "edit" && editingEventId !== null) {
        setSelectedEvent({
          id: editingEventId,
          ...eventData,
        });
      }

      setShowEventForm(false);

      setEditingEventId(null);

      resetEventForm();
    } catch (error) {
      setEventFormError(error instanceof Error ? error.message : "Unable to save calendar event.");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) {
      return;
    }

    /*
     * Automatic deadlines cannot
     * be deleted directly.
     */
    if (
      selectedEvent.type === "deadline" &&
      String(selectedEvent.id).startsWith("deadline-")
    ) {
      return;
    }

    if (isDeletingEvent) return;
    setDeleteError("");
    setIsDeletingEvent(true);
    try {

      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Unable to delete calendar event.");
      }

      setManualEvents((current) =>
        current.filter((event) => event.id !== selectedEvent.id),
      );

      setShowDeleteModal(false);

      setSelectedEvent(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete calendar event.");
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const retryApplications = async () => {
    setIsLoadingApplications(true);

    setApplicationsError("");

    try {
      const response = await fetch("/api/applications", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApplicationsApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load applications.");
      }

      setApplications(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Calendar application load error:", error);

      setApplicationsError(
        error instanceof Error
          ? error.message
          : "Unable to load application deadlines.",
      );
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const isAutomaticDeadline =
    selectedEvent?.type === "deadline" &&
    String(selectedEvent.id).startsWith("deadline-");

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <PageHeader eyebrow="Schedule management" title="Calendar" description="Keep track of application deadlines, interviews, reminders, and important recruitment dates." action={<CalendarToolbar openCreateEvent={openCreateEvent} applications={applications} isLoadingApplications={isLoadingApplications} goToToday={goToToday} goToPreviousMonth={goToPreviousMonth} goToNextMonth={goToNextMonth} />} />

        {!isLoadingApplications &&
          !applicationsError &&
          applications.length === 0 && (
            <div className="next-actions mt-6">
              <p className="text-sm text-slate-700">
                Start by tracking a role. Its deadline will appear here, and you
                can add interviews or reminders to that application.
              </p>
              <Link className="btn w-fit" href="/opportunities">
                Browse Opportunities →
              </Link>
            </div>
          )}
        {eventsError && (
          <div role="alert" className="feedback feedback-error mt-6">
            <div>
              <p>{eventsError}</p>
              <button
                className="btn-secondary mt-3"
                onClick={() => setEventsRetry((v) => v + 1)}
              >
                Retry events
              </button>
            </div>
          </div>
        )}
        {/* API status */}
        {isLoadingApplications && (
          <div className="mt-6 flex items-center gap-3 card px-5 py-4">
            <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" />

            <div>
              <p className="text-sm font-medium text-slate-700">
                Loading application deadlines...
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Calendar deadlines are synchronised from your applications.
              </p>
            </div>
          </div>
        )}

        {!isLoadingApplications && applicationsError && (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Unable to load application deadlines
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {applicationsError}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void retryApplications()}
              className="btn "
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          {/* Calendar */}
          <MonthGrid currentMonth={currentMonth} currentYear={currentYear} calendarDays={calendarDays} events={events} setSelectedEvent={setSelectedEvent} />

          {/* Upcoming */}
          <aside className="order-1 space-y-6 xl:order-2">
            <UpcomingEvents events={upcomingEvents} onSelect={setSelectedEvent} />

            <section className="panel">
              <CalendarDays className="h-5 w-5 text-teal-700" />

              <h2 className="mt-4 text-base font-semibold">
                Stay ahead of deadlines
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Application deadlines are automatically synchronised from your
                tracker. Interviews and reminders can be added manually.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && !showDeleteModal && !showEventForm && (
        <ModalFrame
          label="Event details"
          onClose={() => setSelectedEvent(null)}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
        >
          <button
            type="button"
            aria-label="Close event details"
            onClick={() => setSelectedEvent(null)}
            className="absolute inset-0 bg-slate-950/45 "
          />

          <div className="relative z-10 max-h-[85dvh] overflow-y-auto w-full max-w-lg card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${eventIconStyles[selectedEvent.type]
                    }`}
                >
                  {selectedEvent.type === "interview" ? (
                    <Clock3 className="h-5 w-5" />
                  ) : (
                    <CalendarDays className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">
                      {selectedEvent.title}
                    </h2>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${eventStyles[selectedEvent.type]
                        }`}
                    >
                      {selectedEvent.type.charAt(0).toUpperCase() +
                        selectedEvent.type.slice(1)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedEvent.organisation}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Date
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formatDisplayDate(selectedEvent.date, true)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Time
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {selectedEvent.time || "Not specified"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Location / meeting link
                </p>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-500" />

                  {selectedEvent.location || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Notes
                </p>

                <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selectedEvent.notes ||
                    (isAutomaticDeadline
                      ? "This deadline is automatically synchronised from the related application."
                      : "No notes added for this event.")}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Related application
                </p>

                <p className="mt-2 text-sm font-medium text-slate-800">
                  Application #{selectedEvent.applicationId}
                </p>
              </div>
            </div>

            {/* Automatic deadline actions */}
            {isAutomaticDeadline ? (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  This deadline is managed by the related application.
                </p>

                <Link
                  href={`/applications/${selectedEvent.applicationId}/edit`}
                  className="btn "
                >
                  <Pencil className="h-4 w-4" />
                  Edit application
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => { setDeleteError(""); setShowDeleteModal(true); }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete event
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openEditEvent}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit event
                  </button>

                  <Link
                    href={`/applications/${selectedEvent.applicationId}`}
                    className="btn "
                  >
                    Go to application
                  </Link>
                </div>
              </div>
            )}
          </div>
        </ModalFrame>
      )}

      {/* Event form modal */}
      {showEventForm && (
        <ModalFrame
          label="Calendar event"
          onClose={() => {
            if (!isSavingEvent) closeEventForm();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
        >
          <button
            type="button"
            aria-label="Close event form"
            disabled={isSavingEvent}
            onClick={closeEventForm}
            className="absolute inset-0 bg-slate-950/45 "
          />

          <div className="relative z-10 max-h-full w-full max-w-xl overflow-y-auto card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                  {formMode === "edit" ? (
                    <Pencil className="h-5 w-5" />
                  ) : (
                    <CalendarDays className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {formMode === "edit"
                      ? "Edit calendar event"
                      : "Add calendar event"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {formMode === "edit"
                      ? "Update the selected interview or reminder."
                      : "Add an interview or reminder related to an application."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSavingEvent}
                onClick={closeEventForm}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {eventFormError && <p role="alert" className="text-sm text-rose-600">{eventFormError}</p>}
              {/* Event type */}
              <div>
                <label
                  htmlFor="eventType"
                  className="text-sm font-medium text-slate-700"
                >
                  Event type
                </label>

                <select
                  id="eventType"
                  value={eventType}
                  disabled={isSavingEvent}
                  onChange={(event) =>
                    setEventType(event.target.value as EventType)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
                >
                  <option value="interview">Interview</option>

                  <option value="reminder">Reminder</option>
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Application deadlines are generated automatically and cannot
                  be created manually.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Application */}
                <div>
                  <label
                    htmlFor="applicationId"
                    className="text-sm font-medium text-slate-700"
                  >
                    Application <span className="text-rose-500">*</span>
                  </label>

                  <select
                    id="applicationId"
                    value={applicationId}
                    disabled={isSavingEvent}
                    onChange={(event) => {
                      const value = event.target.value;

                      setApplicationId(value);

                      const relatedApplication = applications.find(
                        (application) => String(application.id) === value,
                      );

                      if (relatedApplication) {
                        setOrganisation(relatedApplication.organisation);
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
                  >
                    {applications.length > 0 ? (
                      applications.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.organisation} — {application.roleTitle}
                        </option>
                      ))
                    ) : (
                      <option value="">No applications available</option>
                    )}
                  </select>
                </div>

                {/* Organisation */}
                <div>
                  <label
                    htmlFor="organisation"
                    className="text-sm font-medium text-slate-700"
                  >
                    Organisation
                  </label>

                  <input
                    id="organisation"
                    type="text"
                    value={organisation}
                    readOnly
                    className="mt-2 w-full cursor-default rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Event title */}
              <div>
                <label
                  htmlFor="eventTitle"
                  className="text-sm font-medium text-slate-700"
                >
                  Event title
                </label>

                <input
                  id="eventTitle"
                  type="text"
                  value={eventTitle}
                  disabled={isSavingEvent}
                  onChange={(event) => setEventTitle(event.target.value)}
                  placeholder={
                    eventType === "interview"
                      ? "Technical interview"
                      : "Follow-up reminder"
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Date */}
                <div>
                  <label
                    htmlFor="eventDate"
                    className="text-sm font-medium text-slate-700"
                  >
                    Date <span className="text-rose-500">*</span>
                  </label>

                  <input
                    id="eventDate"
                    type="date"
                    lang="en-NZ"
                    value={eventDate}
                    disabled={isSavingEvent}
                    onChange={(event) => setEventDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
                  />
                </div>

                {/* Time */}
                <div>
                  <label
                    htmlFor="eventTime"
                    className="text-sm font-medium text-slate-700"
                  >
                    Time
                  </label>

                  <input
                    id="eventTime"
                    type="time"
                    value={eventTime}
                    disabled={isSavingEvent}
                    onChange={(event) => setEventTime(event.target.value)}
                    step={60}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="eventLocation"
                  className="text-sm font-medium text-slate-700"
                >
                  Location / meeting link
                </label>

                <input
                  id="eventLocation"
                  type="text"
                  value={eventLocation}
                  disabled={isSavingEvent}
                  onChange={(event) => setEventLocation(event.target.value)}
                  placeholder="e.g. Zoom, Teams, Auckland CBD"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="eventNotes"
                  className="text-sm font-medium text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="eventNotes"
                  rows={4}
                  value={eventNotes}
                  disabled={isSavingEvent}
                  onChange={(event) => setEventNotes(event.target.value)}
                  placeholder="Add useful preparation notes or reminders..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                disabled={isSavingEvent}
                onClick={closeEventForm}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isSavingEvent ||
                  !applicationId ||
                  !organisation.trim() ||
                  !eventDate.trim()
                }
                onClick={() => void handleSaveEvent()}
                className="btn min-w-34 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingEvent ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />

                    {formMode === "edit" ? "Saving changes..." : "Saving..."}
                  </>
                ) : formMode === "edit" ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    Save changes
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add event
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalFrame>
      )}

      {/* Delete confirmation modal */}
      {selectedEvent && showDeleteModal && !isAutomaticDeadline && (
        <ModalFrame
          label="Delete event"
          onClose={() => {
            if (!isDeletingEvent) setShowDeleteModal(false);
          }}
          className="fixed inset-0 z-60 flex items-center justify-center px-4"
        >
          <button
            type="button"
            aria-label="Close delete confirmation"
            disabled={isDeletingEvent}
            onClick={() => setShowDeleteModal(false)}
            className="absolute inset-0 bg-slate-950/50 "
          />

          <div className="relative z-10 w-full max-w-md card p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>

            {deleteError && <p role="alert" className="mt-4 text-sm text-rose-600">{deleteError}</p>}
            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Delete event?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to delete{" "}
              <span className="font-medium text-slate-700">
                {selectedEvent.title}
              </span>{" "}
              for{" "}
              <span className="font-medium text-slate-700">
                {selectedEvent.organisation}
              </span>
              .
            </p>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
              <p className="text-xs leading-5 text-rose-700">
                This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={() => void handleDeleteEvent()}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingEvent ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete event
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalFrame>
      )}
    </DashboardLayout>
  );
}
