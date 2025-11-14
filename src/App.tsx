import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

/* Styles de base Ionic */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import { useEffect } from "react";
import { requestNotificationPermission } from "./permissions/notifications";

setupIonicReact();

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  // 🔔 Demande automatiquement la permission dès le lancement de l’app
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Page de connexion */}
          <Route exact path="/login">
            {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
          </Route>

          {/* Dashboard */}
          <Route exact path="/dashboard">
            {isAuthenticated ? <Dashboard /> : <Redirect to="/login" />}
          </Route>

          {/* Redirection par défaut */}
          <Redirect
            exact
            from="/"
            to={isAuthenticated ? "/dashboard" : "/login"}
          />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
