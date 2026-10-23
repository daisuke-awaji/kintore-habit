import { useEffect, type ReactNode } from 'react';
import { TabBar } from './components/TabBar';
import { useRoute } from './router';
import { initVoices } from './services/feedback';
import { Done } from './screens/Done';
import { Home } from './screens/Home';
import { Log } from './screens/Log';
import { Onboarding } from './screens/Onboarding';
import { Settings } from './screens/Settings';
import { Workout } from './screens/Workout';
import { useAppData } from './state/AppData';

function Shell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <>
      {children}
      <TabBar current={current} />
    </>
  );
}

export function App() {
  const route = useRoute();
  const { data } = useAppData();

  useEffect(() => {
    initVoices();
  }, []);

  if (!data.onboarded) return <Onboarding />;

  switch (route.path) {
    case '/workout':
      return <Workout params={route.params} />;
    case '/done':
      return <Done params={route.params} />;
    case '/log':
      return <Shell current="/log"><Log /></Shell>;
    case '/settings':
      return <Shell current="/settings"><Settings /></Shell>;
    default:
      return <Shell current="/"><Home /></Shell>;
  }
}
