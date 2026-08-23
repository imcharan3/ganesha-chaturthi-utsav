import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Sparkles, Trophy, Utensils, Flame, Download, CheckCircle2, ChevronRight, Edit3, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const EventsTimeline = ({ events, settings, onRefreshEvents, setActiveTab }) => {
  const { isAdmin, adminToken } = useAuth();
  const [selectedDay, setSelectedDay] = useState(1);
  
  // Admin Edit Event State
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', time: '', description: '', status: 'Upcoming' });

  const currentEvent = events?.find(e => e.dayNumber === selectedDay) || events?.[0];

  // Helper to generate iCalendar (.ics) event reminder
  const downloadCalendarReminder = (event) => {
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vinayaka Chavithi Utsav//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title} - ${settings?.utsavName || 'Ganesh Utsav'}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${settings?.location || 'Main Mandapam'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ganesh_Utsav_Day_${event.dayNumber}_Reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEdit = (evt) => {
    setEditingEvent(evt);
    setEditForm({
      title: evt.title,
      time: evt.time,
      description: evt.description,
      status: evt.status || 'Upcoming'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateEvent(editingEvent.id, {
        title: editForm.title.trim(),
        time: editForm.time.trim(),
        description: editForm.description.trim(),
        status: editForm.status
      }, adminToken);
      setEditingEvent(null);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      alert(err.message || 'Failed to update event');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="temple-card p-6 rounded-3xl shadow-xl border border-amber-500/30 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30 mb-2">
            <Calendar className="w-3.5 h-3.5 text-saffron-400" />
            <span>4-Day Divine Utsav Schedule</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold gold-gradient-text font-devotional">
            4 రోజుల ఉత్సవ కార్యక్రమాలు (Festival Events)
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
            మహా గణపతి పూజా విశేషాలు, అన్నదానం, ఉట్టి సంబరాలు, లడ్డూ వేలం మరియు శోభాయాత్ర వివరాలు.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-saffron-400" />
            <span>{settings?.location || 'Main Mandapam'}</span>
          </div>
        </div>
      </div>

      {/* 4 Days Tab Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {(events || []).map((evt) => {
          const isSelected = selectedDay === evt.dayNumber;
          return (
            <button
              key={evt.id}
              onClick={() => setSelectedDay(evt.dayNumber)}
              className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-[#3b170c] via-[#2a0e06] to-[#1e0703] border-amber-400 shadow-gold scale-102'
                  : 'temple-card border-amber-500/20 hover:border-amber-500/40 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-amber-500 text-amber-950' : 'bg-black/40 text-amber-300'
                }`}>
                  Day {evt.dayNumber}
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium">{evt.time}</span>
              </div>

              <h4 className="font-bold text-xs sm:text-sm text-amber-100 line-clamp-1">
                {evt.title}
              </h4>
              <p className="text-[10px] text-amber-300/70 line-clamp-1 font-telugu mt-0.5">
                {evt.titleTelugu}
              </p>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-saffron-500 to-amber-400"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Day Detail Card */}
      {currentEvent && (
        <div className="temple-card p-6 sm:p-8 rounded-3xl border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            
            {/* Event Info */}
            <div className="space-y-4 flex-1">
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 shadow-gold">
                  Day {currentEvent.dayNumber} Celebrations
                </span>
                <span className="text-xs text-amber-300/80 bg-black/40 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-saffron-400" />
                  <span>{currentEvent.time}</span>
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  {currentEvent.status || 'Upcoming'}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold gold-gradient-text font-devotional">
                  {currentEvent.title}
                </h3>
                <p className="text-base sm:text-lg text-amber-200 font-telugu font-semibold mt-1">
                  {currentEvent.titleTelugu}
                </p>
              </div>

              <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed max-w-3xl">
                {currentEvent.description}
              </p>

              {/* Event Program Highlights */}
              {currentEvent.highlights && currentEvent.highlights.length > 0 && (
                <div className="pt-2 space-y-2">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Program Schedule & Key Timings:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentEvent.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#1b0803] p-2.5 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                {currentEvent.dayNumber === 3 && (
                  <button
                    onClick={() => setActiveTab && setActiveTab('auction')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-600 text-amber-950 font-extrabold text-xs sm:text-sm shadow-gold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-amber-950 fill-amber-950" />
                    <span>Open Live Laddu Auction (ప్రత్యక్ష వేలం పాట) ➔</span>
                  </button>
                )}

                <button
                  onClick={() => downloadCalendarReminder(currentEvent)}
                  className="px-4 py-2.5 rounded-xl bg-[#2e1208] hover:bg-[#3d180b] border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Add to Calendar Reminder (.ics)</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(currentEvent)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-amber-950 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Day {currentEvent.dayNumber} Event (Admin)</span>
                  </button>
                )}
              </div>

            </div>

            {/* Visual Icon / Theme for Active Day */}
            <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#2b1007] to-[#1a0703] border border-amber-500/30 rounded-3xl shrink-0 w-64 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-saffron-600 p-1 shadow-gold flex items-center justify-center mb-3 animate-float">
                <div className="w-full h-full rounded-full bg-[#1e0703] flex items-center justify-center">
                  {currentEvent.dayNumber === 1 && <Flame className="w-10 h-10 text-amber-400" />}
                  {currentEvent.dayNumber === 2 && <Utensils className="w-10 h-10 text-amber-400" />}
                  {currentEvent.dayNumber === 3 && <Trophy className="w-10 h-10 text-amber-400" />}
                  {currentEvent.dayNumber === 4 && <Sparkles className="w-10 h-10 text-amber-400" />}
                </div>
              </div>
              <span className="text-sm font-bold text-amber-200">Day {currentEvent.dayNumber} of 4</span>
              <span className="text-xs text-amber-400/80 mt-1">{currentEvent.title}</span>
            </div>

          </div>

        </div>
      )}

      {/* Admin Edit Modal for Events */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#240e06] border border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-devotional text-lg font-bold gold-gradient-text flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Edit Day {editingEvent.dayNumber} Event</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Event Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Event Timing</label>
                <input
                  type="text"
                  required
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-amber-300 mb-1 font-semibold">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#170702] border border-amber-500/40 text-amber-100 focus:outline-none"
                >
                  <option value="Upcoming">Upcoming ⏳</option>
                  <option value="Happening Today">Happening Today 🔥</option>
                  <option value="Completed">Completed ✅</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#34160b] text-amber-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron-500 text-amber-950 font-bold"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
