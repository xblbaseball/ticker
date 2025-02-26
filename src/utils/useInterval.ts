import { useEffect, useRef } from 'react';

// borrowed from: https://github.com/juliencrn/usehooks-ts/blob/master/packages/usehooks-ts/src/useInterval/useInterval.ts

/** do something after an interval */
export default function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return
    }

    const id = setInterval(() => {
      savedCallback.current()
    }, delay)

    return () => {
      clearInterval(id)
    }
  }, [delay])
}
