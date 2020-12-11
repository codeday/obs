import React, { useEffect, useState } from 'react';
import { apiFetch } from '@codeday/topo/utils';
import { DateTime } from 'luxon';
import rwc from 'random-weighted-choice';
import LiveAndPreload from '../components/LiveAndPreload';
import AudioPlayer from '../components/AudioPlayer';
import FallbackSlide from '../components/FallbackSlide';
import SimpleVideoSlide from '../components/SimpleVideoSlide';
import ProjectSlide from '../components/ProjectSlide';
import CalendarSlide from '../components/CalendarSlide';
import { BumpersQuery } from './bumpers.gql';
import Slide from '../components/Slide';

export default function Intro({ bumpers, projects, events, music }) {
  const [initialized, setInitialized] = useState(false);

  const getNextElement = (state) => {
    // We have to filter these here because the livestream display could be up for hours or even days, and the events
    // list is only fetched when the page is loaded.
    const cutoff = DateTime.local().plus({ hours: -1 });
    const filteredEvents = events.filter((e) => DateTime.fromISO(e.start) > cutoff);

    const choices = {
      ...(bumpers[state % bumpers.length] && {
        bumper: {
          Component: SimpleVideoSlide,
          props: { src: bumpers[state % bumpers.length] },
        },
      }),
      ...(projects[state % projects.length] && {
        project: {
          Component: ProjectSlide,
          props: { project: projects[state % projects.length] },
        },
      }),
      ...(filteredEvents.length > 0 && {
        calendar: {
          Component: CalendarSlide,
          props: { events: filteredEvents }
        }
      })
    }

    const weights = [
      { id: 'bumper', weight: 0.6 },
      { id: 'project', weight: 0.3 },
      { id: 'calendar', weight: 0.1 },
     ].filter(({ id }) => id in choices);

    const choice = choices[rwc(weights)];
    return choice;
  }

  useEffect(() => {
    if (typeof window !== 'undefined') setInitialized(true);
  }, [typeof window]);

  if (!initialized || bumpers.length === 0) return <></>;

  return (
    <>
      <AudioPlayer tracks={music} />
      <LiveAndPreload fallbackComponent={FallbackSlide} getNextElement={getNextElement} />
    </>
  );
}


const getDate = (offsetHours) => {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - 7 + (offsetHours || 0));
  return d.toISOString();
};

export async function getServerSideProps({ params: { purpose } }) {
  const results = await apiFetch(BumpersQuery, {
    purpose,
    calendarDateStart: getDate(-2),
    calendarDateEnd: getDate(24 * 7 * 4),
  });

  return {
    props: {
      bumpers: results?.cms?.bumpers?.items
        .filter((v) => v.video?.playbackId && v.video?.ready)
        .map((v) => `https://stream.mux.com/${v.video.playbackId}.m3u8`)
        .sort(() => Math.random() > 0.5 ? 1 : -1),
      music: results?.cms?.stockMusics?.items
        .map((m) => m.music?.url)
        .sort(() => Math.random() > 0.5 ? 1 : -1),
      projects: results?.showcase?.projects
        .sort(() => Math.random() > 0.5 ? 1 : -1),
      events: results?.calendar?.events,
    },
  }
}