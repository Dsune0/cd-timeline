// Full corrected implementation with renderTimestamps defined and dark mode support
import React, { useState } from "react";
import { Slider } from "./components/ui/slider";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { motion } from "framer-motion";

const baseAbilities = [
  { name: "Force of Nature", controlOfTheDream: true },
  { name: "Convoke the Spirits", baseCooldown: 120, controlOfTheDream: true },
  { name: "Whirling Stars", charges: 2, controlOfTheDream: true },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CDTimeline() {
  const [timelineLength, setTimelineLength] = useState(300);
  const [events, setEvents] = useState([]);
  const [forceOfNatureCD, setForceOfNatureCD] = useState(60);
  const [whirlingStarsCD, setWhirlingStarsCD] = useState(100);
  const [darkMode, setDarkMode] = useState(true);

  const abilities = baseAbilities.map((a) => {
    if (a.name === "Force of Nature") return { ...a, baseCooldown: forceOfNatureCD };
    if (a.name === "Whirling Stars") return { ...a, baseCooldown: whirlingStarsCD };
    return a;
  });

  const calculateAdjustedCooldown = (event, allEvents = events) => {
    const sameAbilityEvents = allEvents.filter((e) => e.ability === event.ability).sort((a, b) => a.time - b.time);
    let controlCDR = 15;
    for (let i = 0; i < sameAbilityEvents.length; i++) {
      if (sameAbilityEvents[i].id === event.id) {
        if (i > 0) {
          const prev = sameAbilityEvents[i - 1];
          const prevCD = calculateAdjustedCooldown(prev, allEvents);
          const earliestReady = prev.time + prevCD;
          const idleTime = Math.max(0, event.time - earliestReady);
          controlCDR = Math.min(15, idleTime);
        }
        break;
      }
    }
    return Math.max(0, event.cooldown - controlCDR);
  };

  const getWhirlingStarsChargesTimeline = () => {
    const wsEvents = events.filter(e => e.ability === "Whirling Stars").sort((a, b) => a.time - b.time);
    let chargeTimes = [0, 0];
    const usageDetails = [];
    wsEvents.forEach((event) => {
      const availableChargeIndex = chargeTimes[0] <= event.time ? 0 : chargeTimes[1] <= event.time ? 1 : 0;
      const adjustedCD = calculateAdjustedCooldown(event);
      chargeTimes[availableChargeIndex] = event.time + adjustedCD;
      usageDetails.push({ ...event, adjustedCD, charge: availableChargeIndex + 1 });
    });
    return usageDetails;
  };

  const addEvent = (ability) => {
    const sameAbilityEvents = events.filter((e) => e.ability === ability.name).sort((a, b) => a.time - b.time);
    let suggestedTime = 0;
    if (sameAbilityEvents.length > 0) {
      const lastEvent = sameAbilityEvents[sameAbilityEvents.length - 1];
      const lastCD = calculateAdjustedCooldown(lastEvent);
      suggestedTime = lastEvent.time + lastCD;
    }
    const newEvent = {
      id: Date.now(),
      ability: ability.name,
      time: suggestedTime,
      cooldown: ability.baseCooldown,
      controlOfTheDream: ability.controlOfTheDream,
    };
    setEvents([...events, newEvent]);
  };

  const updateEventTime = (id, newTime) => {
    const eventToUpdate = events.find((e) => e.id === id);
    const sameAbilityEvents = events.filter((e) => e.ability === eventToUpdate.ability).sort((a, b) => a.time - b.time);

    let updatedEvents = [...events];

    for (let i = 0; i < sameAbilityEvents.length; i++) {
      if (sameAbilityEvents[i].id === id) {
        const prevEvent = sameAbilityEvents[i - 1];
        if (prevEvent) {
          const prevCD = calculateAdjustedCooldown(prevEvent);
          const minTime = prevEvent.time + prevCD;
          if (newTime < minTime) newTime = minTime;
        }
        updatedEvents = updatedEvents.map((e) => (e.id === id ? { ...e, time: newTime } : e));

        for (let j = i + 1; j < sameAbilityEvents.length; j++) {
          const prev = updatedEvents.find((e) => e.id === sameAbilityEvents[j - 1].id);
          const next = updatedEvents.find((e) => e.id === sameAbilityEvents[j].id);
          const prevCD = calculateAdjustedCooldown(prev, updatedEvents);
          const minTime = prev.time + prevCD;
          if (next.time < minTime) {
            updatedEvents = updatedEvents.map((e) => e.id === next.id ? { ...e, time: minTime } : e);
          }
        }
        break;
      }
    }
    setEvents(updatedEvents);
  };

  const handleInputChange = (id, value) => {
    const parts = value.split(":");
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      seconds = parseInt(parts[0]);
    }
    updateEventTime(id, Math.max(0, seconds || 0));
  };

  const removeEvent = (id) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const renderTimestamps = () => {
    const interval = 30;
    const timestamps = [];
    for (let i = 0; i <= timelineLength; i += interval) {
      timestamps.push(
        <div key={i} className="absolute border-l border-gray-400 h-full text-xs text-gray-600" style={{ left: `${(i / timelineLength) * 100}%` }}>
          <div className="absolute -top-6 left-0 ml-1 whitespace-nowrap">{formatTime(i)}</div>
        </div>
      );
    }
    return timestamps;
  };

  return (
    <div className={`p-4 space-y-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CD Timeline Visualizer</h1>
        <Button onClick={() => setDarkMode(!darkMode)} className="text-sm">Toggle {darkMode ? "Light" : "Dark"} Mode</Button>
      </div>

      <div className="space-x-2">
        {abilities.map((a) => (
          <Button key={a.name} onClick={() => addEvent(a)}>
            Add {a.name}
          </Button>
        ))}
      </div>

      <div className="flex space-x-4">
        <div>
          <label className="block font-semibold">Force of Nature CD:</label>
          <select value={forceOfNatureCD} onChange={(e) => setForceOfNatureCD(Number(e.target.value))} className="border rounded p-1">
            <option value={45}>45s</option>
            <option value={60}>60s</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold">Whirling Stars CD:</label>
          <select value={whirlingStarsCD} onChange={(e) => setWhirlingStarsCD(Number(e.target.value))} className="border rounded p-1">
            <option value={90}>90s</option>
            <option value={100}>100s</option>
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {abilities.map((ability) => (
          <div key={ability.name}>
            <h2 className="font-semibold text-lg mb-2">{ability.name}</h2>
            <div className="flex flex-wrap gap-4">
              {(ability.name === "Whirling Stars" ? getWhirlingStarsChargesTimeline() : events.filter((e) => e.ability === ability.name)).map((event) => (
                <Card key={event.id} className="w-[300px]">
                  <CardContent className="p-2 space-y-2">
                    <div className="text-sm font-medium">{event.ability} at {formatTime(event.time)} {event.charge ? `(Charge ${event.charge})` : ""}</div>
                    <input
                      type="text"
                      value={formatTime(event.time)}
                      onChange={(e) => handleInputChange(event.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full"
                    />
                    <Slider
                      min={0}
                      max={timelineLength}
                      step={1}
                      value={[event.time]}
                      onValueChange={(value) => updateEventTime(event.id, value[0])}
                    />
                    <Button size="sm" variant="destructive" className="w-fit px-2 py-1 text-xs" onClick={() => removeEvent(event.id)}>
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t pt-4">
        <div className={`relative border overflow-visible h-10 ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>{renderTimestamps()}</div>
        {abilities.map((ability) => (
          <div key={ability.name} className={`relative h-12 border-b ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            {(ability.name === "Whirling Stars" ? getWhirlingStarsChargesTimeline() : events.filter((e) => e.ability === ability.name)).map((event, index, allEvents) => {
              const adjustedCD = event.adjustedCD || calculateAdjustedCooldown(event);
              const widthPercent = (adjustedCD / timelineLength) * 100;
              const start = event.time;
              const end = start + adjustedCD;
              const overlapping = allEvents.some(
                (e, i) => e.id !== event.id &&
                  ((e.time < end && e.time >= start) ||
                  (e.time <= start && (e.time + calculateAdjustedCooldown(e)) > start))
              );
              const bgColor = overlapping && (ability.name === "Convoke the Spirits" || ability.name === "Whirling Stars" || ability.name === "Force of Nature") ? "bg-gray-400" : "bg-blue-500";
              return (
                <motion.div
                  key={event.id}
                  className={`absolute top-1 h-10 text-xs px-2 py-1 text-white border border-black cursor-pointer ${bgColor}`}
                  style={{
                    left: `${(start / timelineLength) * 100}%`,
                    width: `${widthPercent}%`,
                    borderRadius: 0,
                    minWidth: 60,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="font-bold">{event.ability} {event.charge ? `(Charge ${event.charge})` : ""}</div>
                  <div className="text-[10px]">{formatTime(start)} → {formatTime(end)}</div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
