import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import API_URL from "../api/config";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMessage("Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setToastMessage("✅ Connexion réussie !");
        // ⏳ Petite pause pour afficher le toast avant la redirection
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setToastMessage(data.message || "❌ Identifiants incorrects");
      }
    } catch (error) {
      console.error("Erreur de connexion :", error);
      setToastMessage("🚨 Erreur de connexion au serveur");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Poulailler IoT - Connexion</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <h2 className="ion-text-center">Bienvenue 🐔</h2>

            <IonInput
              label="Adresse Email"
              type="email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
              fill="outline"
              placeholder="exemple@mail.com"
              className="ion-margin-vertical"
            />

            <IonInput
              label="Mot de passe"
              type="password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
              fill="outline"
              placeholder="••••••••"
              className="ion-margin-vertical"
            />

            <IonButton expand="block" onClick={handleLogin}>
              Se connecter
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          color={toastMessage.includes("✅") ? "success" : "danger"}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
