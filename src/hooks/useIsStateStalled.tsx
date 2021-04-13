import { useEffect, useRef, useState } from 'react'

// With object or functions use memoized versions (useMemo / useCallback)
export const useIsStateStalled = <T,>(state: T, stalledIn: T, timeout: number) => {
  const [isStalled, setIsStalled] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let timer: Maybe<number> = null
    if (stateRef.current === stalledIn) {
      timer = setTimeout(() => {
        if (stateRef.current === stalledIn) {
          setIsStalled(true)
        }
      }, timeout)
    } else {
      setIsStalled(false)
    }
    return () => {
      timer && clearTimeout(timer)
    }
  }, [state, stalledIn, timeout])

  return isStalled
}
