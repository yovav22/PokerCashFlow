import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { AppDataProvider } from "@/context/AppDataContext"

function App() {
  return (
    <AppDataProvider>
      <Pages />
      <Toaster />
    </AppDataProvider>
  )
}

export default App 