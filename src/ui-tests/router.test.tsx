// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, expect, it } from 'vitest';
import { navigate, useRoute } from '../router';

afterEach(cleanup);

function Child() {
  useEffect(() => {
    navigate('/next', undefined, { replace: true });
  }, []);
  return null;
}

function Parent() {
  const r = useRoute();
  return r.path === '/start' ? <Child /> : <p>{r.path}</p>;
}

it('子の画面がマウント直後に移動しても、ルートが追いつく', async () => {
  history.replaceState(null, '', '#/start');
  const view = render(<Parent />);
  await act(async () => {});
  expect(view.container.textContent).toBe('/next');
});
