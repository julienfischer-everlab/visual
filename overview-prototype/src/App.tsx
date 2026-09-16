import { AppShell } from './layout/AppShell'
import { Overview } from './pages/Overview'
import { DeviceFrame } from './prototype/DeviceFrame'
import { NavigationProvider } from './prototype/NavigationContext'
import { PrototypeControls } from './prototype/PrototypeControls'
import { PrototypeProvider, usePrototype } from './prototype/PrototypeContext'
import { RouteNote } from './prototype/RouteNote'
import './App.css'

/** The product, with no prototype scaffolding inside it. */
function Product() {
  return (
    <AppShell>
      <Overview />
    </AppShell>
  )
}

function Stage() {
  const { viewport, theme } = usePrototype()

  return (
    <div className="stage" data-viewport={viewport} data-theme={theme}>
      {viewport === 'mobile' ? (
        <DeviceFrame>
          <Product />
        </DeviceFrame>
      ) : (
        <Product />
      )}
    </div>
  )
}

export default function App() {
  return (
    <PrototypeProvider>
      <NavigationProvider>
        <Stage />
        <PrototypeControls />
        <RouteNote />
      </NavigationProvider>
    </PrototypeProvider>
  )
}
