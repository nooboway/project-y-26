import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudioProvider } from "@/lib/audio";
import { FloatingAudio } from "@/components/Chrome";
import Cover from "@/pages/Cover";
import DayPage from "@/pages/Day";
import Locked from "@/pages/Locked";
import Archive from "@/pages/Archive";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Cover} />
      <Route path="/day/:slug" component={DayPage} />
      <Route path="/locked" component={Locked} />
      <Route path="/archive" component={Archive} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Routes />
          <FloatingAudio />
        </WouterRouter>
      </AudioProvider>
    </QueryClientProvider>
  );
}

export default App;
