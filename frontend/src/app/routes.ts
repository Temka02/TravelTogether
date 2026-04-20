import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/pages/Home";
import { TripDetail } from "./components/pages/TripDetail";
import { Profile } from "./components/pages/Profile";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import CreateTrip from "./components/pages/CreateTrip";
import EditTrip from "./components/pages/EditTrip";
import Applications from "./components/pages/Applications";
import MyTrips from "./components/pages/MyTrips";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "trips/:id", Component: TripDetail },
      { path: "profile", Component: Profile },
      { path: "trips/create-trip", Component: CreateTrip },
      { path: "trips/edit-trip/:id", Component: EditTrip },
      { path: "my-trips", Component: MyTrips },
      { path: "applications", Component: Applications },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
]);
