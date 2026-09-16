/**
 * Prototype state — the tweak controls, kept deliberately separate from the
 * product UI. Modules read the flags they care about through `usePrototype()`
 * so a new state can be tested without prop-drilling through the page.
 */

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ViewportMode = 'mobile' | 'desktop'
export type ThemeMode = 'light' | 'dark'

export interface PrototypeState {
  /** Device frame + breakpoint being tested. */
  viewport: ViewportMode
  /** Biomarkers ON = metric cards carry data, OFF = locked/empty state. */
  biomarkers: boolean
  /** Reserved for the new-user Overview composition, defined later. */
  isNewUser: boolean
  theme: ThemeMode
}

export interface PrototypeContextValue extends PrototypeState {
  setViewport: (value: ViewportMode) => void
  setBiomarkers: (value: boolean) => void
  setIsNewUser: (value: boolean) => void
  setTheme: (value: ThemeMode) => void
}

const defaultState: PrototypeState = {
  viewport: 'mobile',
  biomarkers: true,
  isNewUser: false,
  theme: 'light',
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null)

export function PrototypeProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: Partial<PrototypeState>
}) {
  const [state, setState] = useState<PrototypeState>({
    ...defaultState,
    ...initialState,
  })

  const value = useMemo<PrototypeContextValue>(
    () => ({
      ...state,
      setViewport: (viewport) => setState((prev) => ({ ...prev, viewport })),
      setBiomarkers: (biomarkers) => setState((prev) => ({ ...prev, biomarkers })),
      setIsNewUser: (isNewUser) => setState((prev) => ({ ...prev, isNewUser })),
      setTheme: (theme) => setState((prev) => ({ ...prev, theme })),
    }),
    [state],
  )

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>
}

export function usePrototype(): PrototypeContextValue {
  const context = useContext(PrototypeContext)
  if (!context) {
    throw new Error('usePrototype must be used inside a PrototypeProvider')
  }
  return context
}
